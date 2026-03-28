import path from 'node:path'
import type { AiNotesConfig } from '../types/project.ts'
import { withDefaults } from './defaults.ts'

export async function loadConfig(root: string): Promise<AiNotesConfig> {
  const configPath = path.resolve(root, 'ai-notes.config.ts')

  try {
    const mod = await import(configPath)
    const raw = mod.default ?? mod
    return withDefaults({ ...raw, root })
  } catch {
    return withDefaults({ root })
  }
}
