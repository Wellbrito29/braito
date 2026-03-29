import path from 'node:path'
import type { AiNotesConfig } from '../types/project.ts'
import { withDefaults } from './defaults.ts'
import { aiNotesConfigSchema } from './configSchema.ts'

export async function loadConfig(root: string): Promise<AiNotesConfig> {
  const configPath = path.resolve(root, 'ai-notes.config.ts')

  try {
    const mod = await import(configPath)
    const raw = mod.default ?? mod
    const merged = withDefaults({ ...raw, root })

    const result = aiNotesConfigSchema.safeParse(merged)
    if (!result.success) {
      const messages = result.error.issues
        .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')
      throw new Error(`Invalid ai-notes.config.ts:\n${messages}`)
    }

    return result.data
  } catch (err) {
    // Re-throw validation errors; silently fall back to defaults for missing config
    if (err instanceof Error && err.message.startsWith('Invalid ai-notes.config.ts')) {
      throw err
    }
    return withDefaults({ root })
  }
}

