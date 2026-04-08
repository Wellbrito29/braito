import path from 'node:path'
import fs from 'node:fs/promises'
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
import { diffNotes, renderDiff } from '../../core/output/diffNotes.ts'
import { buildOverview } from '../../core/output/buildOverview.ts'
import { writeOverview } from '../../core/output/writeOverview.ts'
import { writeGraph } from '../../core/output/writeGraph.ts'
import { createProvider } from '../../core/llm/provider/factory.ts'
import { synthesizeFileNote } from '../../core/llm/synthesizeFileNote.ts'
import { synthesizeOverview } from '../../core/llm/synthesizeOverview.ts'
import { computeHash } from '../../core/cache/computeHash.ts'
import { loadCache, saveCache } from '../../core/cache/cacheStore.ts'
import { loadAnalysisStore, saveAnalysisStore } from '../../core/cache/analysisStore.ts'
import { concurrentMap } from '../../core/utils/concurrentMap.ts'
import { logger } from '../../core/utils/logger.ts'
import { ProgressBar } from '../../core/utils/progress.ts'
import { tracer } from '../../core/llm/trace.ts'
import type { AiFileNote } from '../../core/types/ai-note.ts'
import type { NoteDiff } from '../../core/output/diffNotes.ts'
import type { StaticFileAnalysis } from '../../core/types/file-analysis.ts'

const DEFAULT_LLM_THRESHOLD = 0.4

export async function runGenerate(args: {
  root?: string
  force?: boolean
  filter?: string
  diff?: boolean
  dryRun?: boolean
  cascade?: boolean
  forceFiles?: Set<string>
}): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)

  // Init LLM tracer so providers can write real-time events to the trace file
  tracer.init(path.resolve(root, config.output))

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

  const analysisProgress = new ProgressBar(files.length, 'Analyzing')
  for (const file of files) {
    const hash = await computeHash(file.path)
    fileHashes.set(file.relativePath, hash)

    const cachedAnalysis = analysisStore.get(file.relativePath)
    const noteHash = noteHashStore.get(file.relativePath)

    if (!args.force && cachedAnalysis && noteHash === hash) {
      // File unchanged and note is current — reuse cached AST analysis.
      // Normalize filePath to current machine's absolute path (cache may come from CI or another machine).
      analyses.push({ ...cachedAnalysis, filePath: file.path })
      analysisHits++
      logger.debug(`Cache hit: ${file.relativePath}`)
    } else {
      logger.debug(`Parsing: ${file.relativePath}`)
      const analysis = parseFile(file.path)
      analyses.push(analysis)
      analysisStore.set(file.relativePath, analysis)
    }
    analysisProgress.tick(file.relativePath)
  }

  if (analysisHits > 0) logger.info(`Reused ${analysisHits} cached analyses (skipped ts-morph parse)`)

  // 4. Persist updated analysis cache (skip in dry-run — no files should be written)
  if (!args.dryRun) await saveAnalysisStore(root, analysisStore)

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

  // 6. Cascade: find dependents of changed files and force-reprocess them
  //    A file is "changed" when its current hash differs from the stored note hash.
  //    We traverse the reverse dependency graph (BFS, depth 2) and collect all
  //    dependents — these will be reprocessed even if their own hash is unchanged.
  const cascadeForceSet = new Set<string>()
  if (args.cascade && !args.force) {
    const changedFiles = files.filter((f) => {
      const stored = noteHashStore.get(f.relativePath)
      const current = fileHashes.get(f.relativePath)
      return stored !== current
    })

    if (changedFiles.length > 0) {
      logger.info(`Cascade: ${changedFiles.length} changed file(s) — propagating to dependents...`)
      const frontier = changedFiles.map((f) => f.path)
      const visited = new Set(frontier)

      // BFS depth 2
      for (let depth = 0; depth < 2; depth++) {
        const next: string[] = []
        for (const filePath of frontier) {
          for (const dep of (revGraph.get(filePath) ?? [])) {
            if (!visited.has(dep)) {
              visited.add(dep)
              next.push(dep)
              const rel = path.relative(root, dep)
              cascadeForceSet.add(rel)
            }
          }
        }
        frontier.length = 0
        frontier.push(...next)
        if (frontier.length === 0) break
      }

      if (cascadeForceSet.size > 0) {
        logger.info(`Cascade: will reprocess ${cascadeForceSet.size} dependent file(s)`)
      }
    }
  }

  // 6b. Load coverage report (optional — lcov.info or coverage-summary.json)
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
  if (!args.dryRun) logger.info('Writing notes...')
  let written = 0
  let skipped = 0
  let synthesized = 0
  const notes: AiFileNote[] = []
  const diffs: NoteDiff[] = []

  // Dry-run tracking
  type DryRunEntry = { relativePath: string; score: number; useLlm: boolean; wouldSkip: boolean }
  const dryRunEntries: DryRunEntry[] = []

  // Use concurrentMap so multiple files are processed in parallel up to `concurrency` limit.
  // Results may be null when a file is skipped (hash unchanged).
  const progress = new ProgressBar(filteredAnalyses.length, 'Writing notes')
  const noteResults = await concurrentMap(
    filteredAnalyses,
    async (analysis): Promise<{ note: AiFileNote; relativePath: string; hash: string; diff?: NoteDiff } | null> => {
      const file = files.find((f) => f.path === analysis.filePath)!
      const currentHash = fileHashes.get(file.relativePath)!

      // Skip if the note is already up to date for this file
      // Exception: cascade mode forces dependents of changed files to be reprocessed
      if (!args.force && !cascadeForceSet.has(file.relativePath) && !args.forceFiles?.has(file.relativePath) && noteHashStore.get(file.relativePath) === currentHash) {
        if (args.dryRun) {
          dryRunEntries.push({ relativePath: file.relativePath, score: 0, useLlm: false, wouldSkip: true })
        }
        return null
      }

      // Read existing note before overwriting (for diff mode)
      let oldNote: AiFileNote | null = null
      if (args.diff) {
        const existingNotePath = path.resolve(root, config.output, file.relativePath + '.json')
        try {
          const raw = await fs.readFile(existingNotePath, 'utf-8')
          oldNote = JSON.parse(raw) as AiFileNote
        } catch {
          // No existing note — treat as new file, no diff to compute
        }
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

      let note = buildBasicNote(analysis, graph, tests, gitSignals, root, cycleFiles)
      logger.debug(`${file.relativePath}: score=${note.criticalityScore.toFixed(2)}, deps=${graph.directDependencies.length}, consumers=${graph.reverseDependencies.length}`)

      const wouldUseLlm = !!(provider && note.criticalityScore >= llmThreshold)

      if (args.dryRun) {
        dryRunEntries.push({ relativePath: file.relativePath, score: note.criticalityScore, useLlm: wouldUseLlm, wouldSkip: false })
        return { note, relativePath: file.relativePath, hash: currentHash }
      }

      if (wouldUseLlm) {
        logger.debug(`LLM synthesizing: ${file.relativePath} (score=${note.criticalityScore.toFixed(2)})`)

        // Build a map of local import path → exports[] for richer prompt context
        const localImportExports = new Map<string, string[]>()
        for (const dep of graph.directDependencies) {
          const depAnalysis = analyses.find((a) => a.filePath === dep)
          if (depAnalysis && depAnalysis.exports.length > 0) {
            localImportExports.set(path.relative(root, dep), depAnalysis.exports)
          }
        }

        note = await synthesizeFileNote(
          { analysis, graph, tests, git: gitSignals, staticNote: note, maxSourceLines: config.maxSourceLines, localImportExports },
          provider!,
          temperature,
          timeoutMs,
        )
        synthesized++
        logger.info(`✓ LLM: ${file.relativePath}`)
      } else {
        logger.info(`✓ static: ${file.relativePath}`)
      }

      const diff = (args.diff && oldNote) ? diffNotes(oldNote, note) : undefined

      progress.tick(path.relative(root, analysis.filePath))

      await writeJsonNote(note, root, config.output)
      await writeMarkdownNote(note, root, config.output)

      return { note, relativePath: file.relativePath, hash: currentHash, diff }
    },
    concurrency,
  )

  for (const result of noteResults) {
    if (result === null) {
      skipped++
    } else {
      if (!args.dryRun) {
        noteHashStore.set(result.relativePath, result.hash)
      }
      notes.push(result.note)
      if (result.diff) diffs.push(result.diff)
      written++
    }
  }

  // Dry-run: print summary and exit without writing anything
  if (args.dryRun) {
    logger.info('Dry run — no files will be written\n')
    const maxLen = dryRunEntries.reduce((m, e) => Math.max(m, e.relativePath.length), 0)
    for (const entry of dryRunEntries) {
      if (entry.wouldSkip) {
        logger.info(`  Would skip:   ${entry.relativePath}  (unchanged)`)
      } else {
        const synthesis = entry.useLlm ? 'LLM' : 'static'
        const padded = entry.relativePath.padEnd(maxLen)
        logger.info(`  Would write:  ${padded}  (score: ${entry.score.toFixed(2)}, ${synthesis})`)
      }
    }
    const wouldWrite = dryRunEntries.filter((e) => !e.wouldSkip).length
    const wouldSkip = dryRunEntries.filter((e) => e.wouldSkip).length
    const wouldUseLlm = dryRunEntries.filter((e) => e.useLlm).length
    logger.info(`\n  Summary: ${wouldWrite} would be written, ${wouldSkip} skipped, ${wouldUseLlm} would use LLM synthesis`)
    return
  }

  // 9. Save note cache
  await saveCache(root, noteHashStore)

  // 10. Load existing notes for skipped files so the index is always complete
  for (const analysis of filteredAnalyses) {
    const relativePath = path.relative(root, analysis.filePath)
    // If this analysis was skipped (result.note not in notes), load from disk
    const alreadyIncluded = notes.some((n) => n.filePath === analysis.filePath)
    if (!alreadyIncluded) {
      const existingNotePath = path.resolve(root, config.output, relativePath + '.json')
      try {
        const raw = await fs.readFile(existingNotePath, 'utf-8')
        notes.push(JSON.parse(raw) as AiFileNote)
      } catch {
        // No existing note on disk — skip
      }
    }
  }

  // 11. Build and write index
  const index = buildIndex(notes, root, config.staleThresholdDays, revGraph)
  await writeIndexNote(index, root, config.output)

  // 11b. Persist dependency graph to graph.json
  const nodeMetaMap = new Map(
    index.entries.map((e) => [e.relativePath, { domain: e.domain, criticalityScore: e.criticalityScore }]),
  )
  await writeGraph(depGraph, nodeMetaMap, root, config.output)

  // 11. Build and write repo overview
  let overview = buildOverview(index, cycles.length)
  if (provider) {
    logger.info('Synthesizing repo overview...')
    overview = await synthesizeOverview(overview, provider, temperature, timeoutMs)
  }
  await writeOverview(overview, root, config.output)

  logger.success(`Generated ${written} notes in ${config.output}/`)
  if (skipped > 0) logger.info(`Skipped ${skipped} unchanged files (use --force to reprocess)`)
  if (args.cascade && cascadeForceSet.size > 0) logger.info(`Cascade: reprocessed ${cascadeForceSet.size} dependent file(s)`)
  if (provider) logger.info(`LLM synthesized: ${synthesized} files`)
  if (index.staleFiles > 0) {
    logger.warn(`${index.staleFiles} note(s) are older than ${config.staleThresholdDays} days — run with --force to refresh`)
  }

  if (args.diff) {
    console.log('\n--- Diff Report ---')
    console.log(renderDiff(diffs))
  }
}
