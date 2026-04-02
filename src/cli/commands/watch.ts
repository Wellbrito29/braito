import path from 'node:path'
import fs from 'node:fs'
import { loadConfig } from '../../core/config/loadConfig.ts'
import { scanRepository } from '../../core/scanner/scanRepository.ts'
import { parseFile } from '../../core/ast/parseFile.ts'
import { buildDependencyGraph, updateDependencyGraph } from '../../core/graph/buildDependencyGraph.ts'
import { buildReverseDependencyGraph } from '../../core/graph/buildReverseDependencyGraph.ts'
import { loadBundlerAliases } from '../../core/graph/loadBundlerAliases.ts'
import { detectCycles, filesInCycles } from '../../core/graph/detectCycles.ts'
import { findRelatedTests } from '../../core/tests/findRelatedTests.ts'
import { getGitSignals } from '../../core/git/getGitSignals.ts'
import { buildBasicNote } from '../../core/output/buildBasicNote.ts'
import { writeJsonNote } from '../../core/output/writeJsonNote.ts'
import { writeMarkdownNote } from '../../core/output/writeMarkdownNote.ts'
import { createProvider } from '../../core/llm/provider/factory.ts'
import { synthesizeFileNote } from '../../core/llm/synthesizeFileNote.ts'
import { computeHash } from '../../core/cache/computeHash.ts'
import { loadCache, saveCache } from '../../core/cache/cacheStore.ts'
import { buildIndex } from '../../core/output/buildIndex.ts'
import { writeIndexNote } from '../../core/output/writeIndexNote.ts'
import { logger } from '../../core/utils/logger.ts'
import type { AiFileNote } from '../../core/types/ai-note.ts'

const DEFAULT_LLM_THRESHOLD = 0.4
const DEBOUNCE_MS = 300

export async function runWatch(args: { root?: string }): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)

  logger.info(`Watching ${root} for changes... (Ctrl+C to stop)`)

  // Initial full generate to build graphs and cache
  const files = await scanRepository(config)
  logger.debug(`Found ${files.length} files to watch`)
  const analyses = files.map((f) => parseFile(f.path))
  const aliases = loadBundlerAliases(root)
  logger.debug(`Bundler aliases: ${Object.keys(aliases).length} entries`)
  const depGraph = buildDependencyGraph(analyses, root, aliases)
  let revGraph = buildReverseDependencyGraph(depGraph)
  logger.debug(`Dependency graph: ${depGraph.size} nodes`)
  let cycleFiles = filesInCycles(detectCycles(depGraph))

  const llmConfig = config.llm
  const provider = llmConfig ? createProvider(llmConfig) : null
  const llmThreshold = llmConfig?.llmThreshold ?? DEFAULT_LLM_THRESHOLD
  const temperature = llmConfig?.temperature ?? 0.2
  const timeoutMs = llmConfig?.timeoutMs ?? 30_000

  const hashStore = await loadCache(root)
  const noteMap = new Map<string, AiFileNote>()

  // Generate initial notes
  for (const analysis of analyses) {
    const note = await processFile(analysis.filePath, root, config.output, files, depGraph, revGraph, cycleFiles, provider, llmThreshold, temperature, timeoutMs)
    if (note) {
      noteMap.set(analysis.filePath, note)
      const relPath = path.relative(root, analysis.filePath)
      hashStore.set(relPath, await computeHash(analysis.filePath))
    }
  }

  await saveCache(root, hashStore)
  await writeIndexNote(buildIndex([...noteMap.values()], root, undefined, revGraph), root, config.output)
  logger.success(`Initial generation complete. Watching for changes...`)

  // Debounce map
  const pending = new Map<string, ReturnType<typeof setTimeout>>()

  const watcher = fs.watch(root, { recursive: true }, (_, filename) => {
    if (!filename) return
    if (!filename.endsWith('.ts') && !filename.endsWith('.tsx')) return
    if (config.exclude.some((p) => filename.includes(p.replace('/**', '').replace('**/', '')))) return

    const existing = pending.get(filename)
    if (existing) clearTimeout(existing)

    pending.set(filename, setTimeout(async () => {
      pending.delete(filename)
      const absolutePath = path.resolve(root, filename)

      logger.info(`Changed: ${filename}`)

      // Incrementally update the dependency graph for the changed file only,
      // then rebuild the reverse graph (O(edges), not O(files × parse)).
      const changedAnalysis = parseFile(absolutePath)
      updateDependencyGraph(depGraph, changedAnalysis, root, aliases)
      revGraph = buildReverseDependencyGraph(depGraph)
      cycleFiles = filesInCycles(detectCycles(depGraph))
      logger.debug(`Graph updated incrementally for: ${filename}`)

      const note = await processFile(absolutePath, root, config.output, files, depGraph, revGraph, cycleFiles, provider, llmThreshold, temperature, timeoutMs)
      if (note) {
        noteMap.set(absolutePath, note)
        hashStore.set(filename, await computeHash(absolutePath))
        await saveCache(root, hashStore)
        await writeIndexNote(buildIndex([...noteMap.values()], root, undefined, revGraph), root, config.output)
        logger.success(`Regenerated: ${filename}`)
      }
    }, DEBOUNCE_MS))
  })

  process.on('SIGINT', () => {
    watcher.close()
    logger.info('Watch stopped.')
    process.exit(0)
  })
}

async function processFile(
  filePath: string,
  root: string,
  outputDir: string,
  files: Awaited<ReturnType<typeof scanRepository>>,
  depGraph: Map<string, string[]>,
  revGraph: Map<string, string[]>,
  cycleFiles: Set<string>,
  provider: ReturnType<typeof createProvider> | null,
  llmThreshold: number,
  temperature: number,
  timeoutMs: number,
): Promise<AiFileNote | null> {
  try {
    const analysis = parseFile(filePath)
    const relatedTests = findRelatedTests(filePath, files)
    const gitSignals = getGitSignals(filePath, root)

    const graph = {
      filePath,
      directDependencies: depGraph.get(filePath) ?? [],
      reverseDependencies: revGraph.get(filePath) ?? [],
    }
    const tests = { filePath, relatedTests }

    let note = buildBasicNote(analysis, graph, tests, gitSignals, root, cycleFiles)

    if (provider && note.criticalityScore >= llmThreshold) {
      note = await synthesizeFileNote(
        { analysis, graph, tests, git: gitSignals, staticNote: note },
        provider,
        temperature,
        timeoutMs,
      )
    }

    await writeJsonNote(note, root, outputDir)
    await writeMarkdownNote(note, root, outputDir)
    return note
  } catch (err) {
    logger.warn(`Failed to process ${filePath}: ${(err as Error).message}`)
    return null
  }
}
