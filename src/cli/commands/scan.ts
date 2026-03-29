import path from 'node:path'
import { loadConfig } from '../../core/config/loadConfig.ts'
import { scanRepository } from '../../core/scanner/scanRepository.ts'
import { logger } from '../../core/utils/logger.ts'

export async function runScan(args: { root?: string }): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)
  const files = await scanRepository(config)

  logger.info(`Scanning ${root}`)
  logger.debug(`Include patterns: ${config.include.join(', ')}`)
  logger.debug(`Exclude patterns: ${config.exclude.join(', ')}`)
  logger.info(`Found ${files.length} files\n`)

  for (const file of files) {
    console.log(`  ${file.relativePath}`)
  }
}
