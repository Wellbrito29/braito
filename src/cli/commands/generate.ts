import path from 'node:path'
import { loadConfig } from '../../core/config/loadConfig.ts'
import { scanRepository } from '../../core/scanner/scanRepository.ts'
import { parseFile } from '../../core/ast/parseFile.ts'
import { buildDependencyGraph } from '../../core/graph/buildDependencyGraph.ts'
import { buildReverseDependencyGraph } from '../../core/graph/buildReverseDependencyGraph.ts'
import { findRelatedTests } from '../../core/tests/findRelatedTests.ts'
import { buildBasicNote } from '../../core/output/buildBasicNote.ts'
import { writeJsonNote } from '../../core/output/writeJsonNote.ts'
import { logger } from '../../core/utils/logger.ts'

export async function runGenerate(args: { root?: string }): Promise<void> {
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

  // 4. Generate and write notes
  logger.info('Writing notes...')
  let written = 0

  for (const analysis of analyses) {
    const relatedTests = findRelatedTests(analysis.filePath, files)

    const note = buildBasicNote(
      analysis,
      {
        filePath: analysis.filePath,
        directDependencies: depGraph.get(analysis.filePath) ?? [],
        reverseDependencies: revGraph.get(analysis.filePath) ?? [],
      },
      {
        filePath: analysis.filePath,
        relatedTests,
      },
    )

    await writeJsonNote(note, root, config.output)
    written++
  }

  logger.success(`Generated ${written} notes in ${config.output}/`)
}
