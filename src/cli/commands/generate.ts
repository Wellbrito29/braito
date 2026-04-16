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
import { createProvider } from '../../core/llm/provider/factory.ts'
import { synthesizeFileNote } from '../../core/llm/synthesizeFileNote.ts'
import { loadProjectContext } from '../../core/config/loadProjectContext.ts'
import { computeHash } from '../../core/cache/computeHash.ts'
import { loadCache, saveCache } from '../../core/cache/cacheStore.ts'
import { loadAnalysisStore, saveAnalysisStore } from '../../core/cache/analysisStore.ts'
import { concurrentMap } from '../../core/utils/concurrentMap.ts'
import { writeGraph } from '../../core/output/writeGraph.ts'
import { logger } from '../../core/utils/logger.ts'
import { ProgressBar } from '../../core/utils/progress.ts'
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
  language?: string
  verbose?: boolean
  forceFiles?: Set<string>
}): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)
  const t0 = Date.now()

  logger.info(`Generating notes for ${root}`)
  logger.debug(`Config: llm=${config.llm?.provider ?? 'none'}, output=${config.output}, staleThreshold=${config.staleThresholdDays}d`)

  // 1. Scan
  const tScan = Date.now()
  const files = await scanRepository(config)
  logger.info(`Found ${files.length} files  [${Date.now() - tScan}ms]`)

  // 2. Load caches
  const noteHashStore = args.force ? new Map() : await loadCache(root)
  const analysisStore = args.force ? new Map() : await loadAnalysisStore(root)
  if (args.force) logger.info('Cache bypassed (--force)')

  // 3. Pre-compute hashes and parse files incrementally
  //    Files whose hash matches the stored note hash reuse their cached StaticFileAnalysis,
  //    skipping the expensive ts-morph parse step.
  const tAnalyze = Date.now()
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
      analyses.push(cachedAnalysis)
      analysisHits++
      logger.debug(`Cache hit: ${file.relativePath}`)
    } else {
      logger.debug(`Parsing: ${file.relativePath}`)
      const tFile = Date.now()
      const analysis = parseFile(file.path)
      analyses.push(analysis)
      analysisStore.set(file.relativePath, analysis)
      if (args.verbose) logger.info(`  parsed  ${file.relativePath}  [${Date.now() - tFile}ms]`)
    }
    analysisProgress.tick(file.relativePath)
  }

  if (analysisHits > 0) logger.info(`Reused ${analysisHits} cached analyses (skipped ts-morph parse)`)
  logger.info(`Analyze phase done  [${Date.now() - tAnalyze}ms]`)

  // 4. Persist updated analysis cache (skip in dry-run — no files should be written)
  if (!args.dryRun) await saveAnalysisStore(root, analysisStore)

  // 5. Build dependency graphs
  //    Aliases are loaded from tsconfig.json paths + bundler configs (Vite, Webpack, Metro).
  const tGraph = Date.now()
  logger.info('Building dependency graph...')
  const aliases = loadBundlerAliases(root)
  logger.debug(`Bundler aliases loaded: ${Object.keys(aliases).length} entries`)
  const depGraph = buildDependencyGraph(analyses, root, aliases)
  const revGraph = buildReverseDependencyGraph(depGraph)
  const totalEdges = [...depGraph.values()].reduce((s, v) => s + v.length, 0)
  logger.info(`Graph: ${depGraph.size} nodes, ${totalEdges} edges  [${Date.now() - tGraph}ms]`)
  if (args.verbose) {
    const topConsumers = [...revGraph.entries()]
      .map(([fp, deps]) => ({ fp: path.relative(root, fp), n: deps.length }))
      .filter((e) => e.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 5)
    if (topConsumers.length) {
      logger.info('  Top files by consumers:')
      for (const e of topConsumers) logger.info(`    ${e.n} consumers  ←  ${e.fp}`)
    }
  }

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
  const language = args.language ?? config.language ?? 'en'
  const projectContext = loadProjectContext(root)
  if (projectContext) logger.info('braito.context.md loaded — injecting project context into LLM prompts')

  // Load governance context (optional — from Docs/, Workflows/, Quality/, etc.)
  const { loadGovernanceContext: loadGov } = await import('../../core/governance/loadGovernanceContext.ts')
  const governanceContext = loadGov(root)
  if (governanceContext) {
    logger.info(`Governance docs detected (${governanceContext.model.style}): ${governanceContext.model.docs.length} documents`)
  }

  // Detect divergences between governance docs and actual code (optional)
  const { detectDivergences, divergencesByFile } = await import('../../core/governance/detectDivergence.ts')
  const divergences = governanceContext
    ? detectDivergences({
        governance: governanceContext,
        files: files.map((f) => f.relativePath),
        depGraph,
        revGraph,
        root,
      })
    : []
  const divergenceMap = divergencesByFile(divergences)
  if (divergences.length > 0) {
    const errors = divergences.filter((d) => d.severity === 'error').length
    const warns = divergences.filter((d) => d.severity === 'warn').length
    logger.warn(`Detected ${divergences.length} governance divergence(s): ${errors} error, ${warns} warn`)
  }

  // Use concurrency cap from config when LLM is active; fall back to 1 (sequential) otherwise
  const concurrency = provider ? (llmConfig?.concurrency ?? 5) : 1

  if (provider) {
    logger.info(`LLM synthesis enabled (provider: ${llmConfig!.provider}, threshold: ${llmThreshold}, concurrency: ${concurrency})`)
  }

  // 8. Generate and write notes
  const tWrite = Date.now()
  let totalCostUsd = 0
  let totalDurationMs = 0
  let usageSamples = 0
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
      if (!args.force && !args.forceFiles?.has(file.relativePath) && noteHashStore.get(file.relativePath) === currentHash) {
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

      const fileDivergences = divergenceMap.get(file.relativePath) ?? []
      let note = buildBasicNote(analysis, graph, tests, gitSignals, cycleFiles, governanceContext, fileDivergences, root)
      const wouldUseLlm = !!(provider && note.criticalityScore >= llmThreshold)

      if (args.verbose) {
        const s = note.debugSignals
        const flags = [
          s.hasHooks && 'hooks',
          s.hasExternalImports && 'ext-imports',
          s.hasEnvVars && 'env',
          s.hasApiCalls && 'api-calls',
          !s.hasTests && 'no-tests',
          s.hasTodoComments && 'todo',
          wouldUseLlm && 'LLM',
        ].filter(Boolean).join(' ')
        logger.info(
          `  ${note.criticalityScore.toFixed(2)}  ${file.relativePath}` +
          `  deps=${s.directDepCount} consumers=${s.reverseDepCount} churn=${s.churnScore}` +
          (flags ? `  [${flags}]` : ''),
        )
      } else {
        logger.debug(`${file.relativePath}: score=${note.criticalityScore.toFixed(2)}, deps=${graph.directDependencies.length}, consumers=${graph.reverseDependencies.length}`)
      }

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
          language,
          projectContext,
          (usage) => {
            if (typeof usage.costUsd === 'number') totalCostUsd += usage.costUsd
            if (typeof usage.durationMs === 'number') totalDurationMs += usage.durationMs
            usageSamples++
          },
        )
        synthesized++
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

  // 10. Build and write index
  const index = buildIndex(notes, root, config.staleThresholdDays, revGraph)
  await writeIndexNote(index, root, config.output)

  // 11. Persist dependency graph to graph.json
  const nodeMetaMap = new Map(
    index.entries.map((e) => [e.relativePath, { domain: e.domain, criticalityScore: e.criticalityScore }]),
  )
  await writeGraph(depGraph, nodeMetaMap, root, config.output)

  // 11b. Persist divergences (if any) to .ai-notes/divergences.json
  const divergencesPath = path.join(root, config.output, 'divergences.json')
  if (divergences.length > 0) {
    await fs.writeFile(
      divergencesPath,
      JSON.stringify({ generatedAt: new Date().toISOString(), count: divergences.length, divergences }, null, 2),
    )
  } else {
    // Remove stale divergences file if the current run is clean
    try { await fs.unlink(divergencesPath) } catch {}
  }

  // 12. Build search index for BM25 full-text search
  const { buildSearchIndex } = await import('../../core/output/buildSearchIndex.ts')
  const notesMap = new Map<string, typeof notes[number]>()
  for (const note of notes) {
    notesMap.set(path.relative(root, note.filePath), note)
  }
  const searchIndexJson = buildSearchIndex(notesMap)
  const searchIndexPath = path.join(root, config.output, 'search-index.json')
  await fs.writeFile(searchIndexPath, searchIndexJson)

  logger.info(`Write phase done  [${Date.now() - tWrite}ms]`)
  logger.success(`Generated ${written} notes in ${config.output}/`)
  if (skipped > 0) logger.info(`Skipped ${skipped} unchanged files (use --force to reprocess)`)
  if (provider) {
    logger.info(`LLM synthesized: ${synthesized} files`)
    if (usageSamples > 0) {
      const parts: string[] = []
      if (totalCostUsd > 0) parts.push(`cost $${totalCostUsd.toFixed(4)}`)
      if (totalDurationMs > 0) parts.push(`llm time ${(totalDurationMs / 1000).toFixed(1)}s`)
      if (parts.length > 0) logger.info(`  LLM usage: ${parts.join(', ')} across ${usageSamples} calls`)
    }
  }
  if (index.staleFiles > 0) {
    logger.warn(`${index.staleFiles} note(s) are older than ${config.staleThresholdDays} days — run with --force to refresh`)
  }
  logger.info(`Total time  [${Date.now() - t0}ms]`)

  if (args.verbose && notes.length > 0) {
    const sorted = [...notes].sort((a, b) => b.criticalityScore - a.criticalityScore)
    logger.info('Top 5 files by criticality score:')
    for (const n of sorted.slice(0, 5)) {
      logger.info(`  ${n.criticalityScore.toFixed(2)}  ${path.relative(root, n.filePath)}`)
    }
    const noTests = notes.filter((n) => !n.debugSignals?.hasTests)
    if (noTests.length > 0) {
      logger.info(`Files without tests: ${noTests.length}/${notes.length}`)
    }
  }

  if (args.diff) {
    console.log('\n--- Diff Report ---')
    console.log(renderDiff(diffs))
  }
}
