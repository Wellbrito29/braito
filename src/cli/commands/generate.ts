import path from 'node:path'
import { loadConfig } from '../../core/config/loadConfig.ts'
import { scanRepository } from '../../core/scanner/scanRepository.ts'
import { parseFile } from '../../core/ast/parseFile.ts'
import { buildDependencyGraph } from '../../core/graph/buildDependencyGraph.ts'
import { buildReverseDependencyGraph } from '../../core/graph/buildReverseDependencyGraph.ts'
import { findRelatedTests } from '../../core/tests/findRelatedTests.ts'
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
import { isCacheValid } from '../../core/cache/isCacheValid.ts'
import { logger } from '../../core/utils/logger.ts'
import type { AiFileNote } from '../../core/types/ai-note.ts'

const DEFAULT_LLM_THRESHOLD = 0.4

export async function runGenerate(args: { root?: string; force?: boolean }): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)

  logger.info(`Generating notes for ${root}`)

  // 1. Scan
  const files = await scanRepository(config)
  logger.info(`Found ${files.length} files`)

  // 2. Parse all files
  logger.info('Analyzing files...')
  const analyses = files.map((f) => parseFile(f.path))

  // 3. Build graphs
  logger.info('Building dependency graph...')
  const depGraph = buildDependencyGraph(analyses, root)
  const revGraph = buildReverseDependencyGraph(depGraph)

  // 4. Setup LLM provider (if configured)
  const llmConfig = config.llm
  const provider = llmConfig ? createProvider(llmConfig) : null
  const llmThreshold = llmConfig?.llmThreshold ?? DEFAULT_LLM_THRESHOLD
  const temperature = llmConfig?.temperature ?? 0.2

  if (provider) {
    logger.info(`LLM synthesis enabled (provider: ${llmConfig!.provider}, threshold: ${llmThreshold})`)
  }

  // 5. Load cache
  const hashStore = args.force ? new Map() : await loadCache(root)
  if (args.force) logger.info('Cache bypassed (--force)')

  // 6. Generate and write notes
  logger.info('Writing notes...')
  let written = 0
  let skipped = 0
  let synthesized = 0
  const notes: AiFileNote[] = []

  for (const analysis of analyses) {
    const file = files.find((f) => f.path === analysis.filePath)!

    // Check cache
    if (!args.force && await isCacheValid(analysis.filePath, file.relativePath, hashStore)) {
      skipped++
      continue
    }

    const relatedTests = findRelatedTests(analysis.filePath, files)
    const gitSignals = getGitSignals(analysis.filePath, root)

    const graph = {
      filePath: analysis.filePath,
      directDependencies: depGraph.get(analysis.filePath) ?? [],
      reverseDependencies: revGraph.get(analysis.filePath) ?? [],
    }
    const tests = { filePath: analysis.filePath, relatedTests }

    let note = buildBasicNote(analysis, graph, tests, gitSignals)

    if (provider && note.criticalityScore >= llmThreshold) {
      note = await synthesizeFileNote(
        { analysis, graph, tests, git: gitSignals, staticNote: note },
        provider,
        temperature,
      )
      synthesized++
    }

    await writeJsonNote(note, root, config.output)
    await writeMarkdownNote(note, root, config.output)

    // Update cache
    const hash = await computeHash(analysis.filePath)
    hashStore.set(file.relativePath, hash)

    notes.push(note)
    written++
  }

  // 7. Save cache
  await saveCache(root, hashStore)

  // 8. Build and write index
  await writeIndexNote(buildIndex(notes, root), root, config.output)

  logger.success(`Generated ${written} notes in ${config.output}/`)
  if (skipped > 0) logger.info(`Skipped ${skipped} unchanged files (use --force to reprocess)`)
  if (provider) logger.info(`LLM synthesized: ${synthesized} files`)
}
