import path from 'node:path'
import fs from 'node:fs'
import { loadConfig } from '../../core/config/loadConfig.ts'
import { runGenerate } from './generate.ts'
import { logger } from '../../core/utils/logger.ts'
import type { NoteIndex } from '../../core/output/buildIndex.ts'

/**
 * Re-runs generate only for files flagged as stale in index.json.
 * Avoids a full pipeline run when only a subset of notes has aged out.
 */
export async function runUpdate(args: { root?: string; diff?: boolean }): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)
  const indexPath = path.resolve(root, config.output, 'index.json')

  if (!fs.existsSync(indexPath)) {
    logger.error("No index found. Run 'generate' first.")
    process.exit(1)
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as NoteIndex
  const staleEntries = index.entries.filter((e) => e.stale)

  if (staleEntries.length === 0) {
    logger.success('All notes are up to date — nothing to update.')
    return
  }

  const forceFiles = new Set(staleEntries.map((e) => e.relativePath))
  logger.info(`Found ${staleEntries.length} stale note(s) — reprocessing...`)
  for (const e of staleEntries) {
    logger.debug(`  Stale: ${e.relativePath} (generated ${e.generatedAt})`)
  }

  await runGenerate({ root, forceFiles, diff: args.diff })
}
