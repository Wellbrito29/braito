import path from 'node:path'
import { loadConfig } from '../../core/config/loadConfig.ts'
import { scanRepository } from '../../core/scanner/scanRepository.ts'
import { parseFile } from '../../core/ast/parseFile.ts'
import { buildDependencyGraph } from '../../core/graph/buildDependencyGraph.ts'
import { buildReverseDependencyGraph } from '../../core/graph/buildReverseDependencyGraph.ts'
import { loadBundlerAliases } from '../../core/graph/loadBundlerAliases.ts'
import { detectCycles, filesInCycles } from '../../core/graph/detectCycles.ts'
import { findRelatedTests } from '../../core/tests/findRelatedTests.ts'
import { loadCoverage } from '../../core/tests/loadCoverage.ts'
import { getGitSignals } from '../../core/git/getGitSignals.ts'
import { buildBasicNote } from '../../core/output/buildBasicNote.ts'
import { writeJsonNote } from '../../core/output/writeJsonNote.ts'
import { writeMarkdownNote } from '../../core/output/writeMarkdownNote.ts'
import { buildIndex } from '../../core/output/buildIndex.ts'
import { writeIndexNote } from '../../core/output/writeIndexNote.ts'
import { createProvider } from '../../core/llm/provider/factory.ts'
import { synthesizeFileNote } from '../../core/llm/synthesizeFileNote.ts'
import { computeHash } from '../../core/cache/computeHash.ts'
import { loadCache, saveCache } from '../../core/cache/cacheStore.ts'
import { loadAnalysisStore, saveAnalysisStore } from '../../core/cache/analysisStore.ts'
import { concurrentMap } from '../../core/utils/concurrentMap.ts'
import { logger } from '../../core/utils/logger.ts'
import type { AiFileNote } from '../../core/types/ai-note.ts'
import type { StaticFileAnalysis } from '../../core/types/file-analysis.ts'

const DEFAULT_LLM_THRESHOLD = 0.4

export async function runGenerate(args: {
  root?: string
  force?: boolean
  filter?: string
}): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)

  logger.info(`Generating notes for ${root}`)
  logger.debug(`Config: llm=${config.llm?.provider ?? 'none'}, output=${config.output}, staleThreshold=${config.staleThresholdDays}d`)

  // 1. Scan
  const files = await scanRepository(config)
  logger.info(`Found ${files.length} files`)

  // 2. Load caches
  const noteHashStore = args.force ? new Map() : await loadCache(root)
  const analysisStore = args.force ? new Map() : await loadAnalysisStore(root)
  if (args.force) logger.info('Cache bypassed (--force)')

  // 3. Pre-compute hashes and parse files incrementally
  //    Files whose hash matches the stored note hash reuse their cached StaticFileAnalysis,
  //    skipping the expensive ts-morph parse step.
  logger.info('Analyzing files...')
  const fileHashes = new Map<string, string>()
  const analyses: StaticFileAnalysis[] = []
  let analysisHits = 0

  for (const file of files) {
    const hash = await computeHash(file.path)
    fileHashes.set(file.relativePath, hash)

    const cachedAnalysis = analysisStore.get(file.relativePath)
    const noteHash = noteHashStore.get(file.relativePath)

    if (!args.force && cachedAnalysis && noteHash === hash) {
      // File unchanged and note is current — reuse cached AST analysis
      analyses.push(cachedAnalysis)
      analysisHits++
      logger.debug(`Cache hit: ${file.relativePath}`)
    } else {
      logger.debug(`Parsing: ${file.relativePath}`)
      const analysis = parseFile(file.path)
      analyses.push(analysis)
      analysisStore.set(file.relativePath, analysis)
    }
  }

  if (analysisHits > 0) logger.info(`Reused ${analysisHits} cached analyses (skipped ts-morph parse)`)

  // 4. Persist updated analysis cache
  await saveAnalysisStore(root, analysisStore)

  // 5. Build dependency graphs
  //    Aliases are loaded from tsconfig.json paths + bundler configs (Vite, Webpack, Metro).
  logger.info('Building dependency graph...')
  const aliases = loadBundlerAliases(root)
  logger.debug(`Bundler aliases loaded: ${Object.keys(aliases).length} entries`)
  const depGraph = buildDependencyGraph(analyses, root, aliases)
  const revGraph = buildReverseDependencyGraph(depGraph)
  logger.debug(`Dependency graph: ${depGraph.size} nodes`)

  // Detect circular imports and warn
  const cycles = detectCycles(depGraph)
  const cycleFiles = filesInCycles(cycles)
  if (cycles.length > 0) {
    logger.warn(`Detected ${cycles.length} circular import cycle(s):`)
    for (const cycle of cycles) {
      logger.warn(`  ${cycle.join(' → ')} → ${cycle[0]}`)
    }
  }

  // 6. Load coverage report (optional — lcov.info or coverage-summary.json)
  const coverageMap = loadCoverage(root)
  if (coverageMap) logger.info(`Coverage report loaded (${coverageMap.size} files)`)

  // 7. Apply --filter if specified
  //    The full graph is built from ALL files for accurate dependency signals.
  //    Only the note-writing loop is scoped to the filtered set.
  let filteredAnalyses = analyses
  if (args.filter) {
    const glob = new Bun.Glob(args.filter)
    filteredAnalyses = analyses.filter((a) => glob.match(path.relative(root, a.filePath)))
    logger.info(`Filter '${args.filter}' → ${filteredAnalyses.length} / ${analyses.length} files`)
  }

  // 7. Setup LLM provider (if configured)
  const llmConfig = config.llm
  const provider = llmConfig ? createProvider(llmConfig) : null
  const llmThreshold = llmConfig?.llmThreshold ?? DEFAULT_LLM_THRESHOLD
  const temperature = llmConfig?.temperature ?? 0.2
  const timeoutMs = llmConfig?.timeoutMs ?? 30_000
  // Use concurrency cap from config when LLM is active; fall back to 1 (sequential) otherwise
  const concurrency = provider ? (llmConfig?.concurrency ?? 5) : 1

  if (provider) {
    logger.info(`LLM synthesis enabled (provider: ${llmConfig!.provider}, threshold: ${llmThreshold}, concurrency: ${concurrency})`)
  }

  // 8. Generate and write notes
  logger.info('Writing notes...')
  let written = 0
  let skipped = 0
  let synthesized = 0
  const notes: AiFileNote[] = []

  // Use concurrentMap so multiple files are processed in parallel up to `concurrency` limit.
  // Results may be null when a file is skipped (hash unchanged).
  const noteResults = await concurrentMap(
    filteredAnalyses,
    async (analysis): Promise<{ note: AiFileNote; relativePath: string; hash: string } | null> => {
      const file = files.find((f) => f.path === analysis.filePath)!
      const currentHash = fileHashes.get(file.relativePath)!

      // Skip if the note is already up to date for this file
      if (!args.force && noteHashStore.get(file.relativePath) === currentHash) {
        return null
      }

      const relatedTests = findRelatedTests(analysis.filePath, files)
      const gitSignals = getGitSignals(analysis.filePath, root)

      const graph = {
        filePath: analysis.filePath,
        directDependencies: depGraph.get(analysis.filePath) ?? [],
        reverseDependencies: revGraph.get(analysis.filePath) ?? [],
      }
      const coveragePct = coverageMap?.get(file.relativePath)
      const tests = { filePath: analysis.filePath, relatedTests, coveragePct }

      let note = buildBasicNote(analysis, graph, tests, gitSignals, cycleFiles)
      logger.debug(`${file.relativePath}: score=${note.criticalityScore.toFixed(2)}, deps=${graph.directDependencies.length}, consumers=${graph.reverseDependencies.length}`)

      if (provider && note.criticalityScore >= llmThreshold) {
        logger.debug(`LLM synthesizing: ${file.relativePath} (score=${note.criticalityScore.toFixed(2)})`)
        note = await synthesizeFileNote(
          { analysis, graph, tests, git: gitSignals, staticNote: note },
          provider,
          temperature,
          timeoutMs,
        )
        synthesized++
      }

      await writeJsonNote(note, root, config.output)
      await writeMarkdownNote(note, root, config.output)

      return { note, relativePath: file.relativePath, hash: currentHash }
    },
    concurrency,
  )

  for (const result of noteResults) {
    if (result === null) {
      skipped++
    } else {
      noteHashStore.set(result.relativePath, result.hash)
      notes.push(result.note)
      written++
    }
  }

  // 9. Save note cache
  await saveCache(root, noteHashStore)

  // 10. Build and write index
  const index = buildIndex(notes, root, config.staleThresholdDays)
  await writeIndexNote(index, root, config.output)

  logger.success(`Generated ${written} notes in ${config.output}/`)
  if (skipped > 0) logger.info(`Skipped ${skipped} unchanged files (use --force to reprocess)`)
  if (provider) logger.info(`LLM synthesized: ${synthesized} files`)
  if (index.staleFiles > 0) {
    logger.warn(`${index.staleFiles} note(s) are older than ${config.staleThresholdDays} days — run with --force to refresh`)
  }
}
