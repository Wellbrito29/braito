import type { AiNotesConfig, DiscoveredFile } from '../types/project.ts'
import { discoverFiles } from './discoverFiles.ts'

export async function scanRepository(config: AiNotesConfig): Promise<DiscoveredFile[]> {
  return discoverFiles(config.root, config.include, config.exclude)
}
