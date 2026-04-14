import type { AiNotesConfig } from '../types/project.ts'

export const DEFAULT_INCLUDE = ['**/*.ts', '**/*.tsx']

/** Drop-in include patterns to opt into multi-language support in ai-notes.config.ts */
export const MULTI_LANGUAGE_INCLUDE = [...DEFAULT_INCLUDE, '**/*.py', '**/*.go']

export const DEFAULT_EXCLUDE = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.ai-notes/**',
  'cache/**',
  'coverage/**',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/__tests__/**',
  '**/*.d.ts',
  '**/*.config.ts',
  '**/*.config.js',
]

export const DEFAULT_STALE_THRESHOLD_DAYS = 30
export const DEFAULT_LANGUAGE = 'en'

export function withDefaults(partial: Partial<AiNotesConfig> & { root: string }): AiNotesConfig {
  return {
    ...partial,
    include: partial.include ?? DEFAULT_INCLUDE,
    exclude: partial.exclude ?? DEFAULT_EXCLUDE,
    output: partial.output ?? '.ai-notes',
    staleThresholdDays: partial.staleThresholdDays ?? DEFAULT_STALE_THRESHOLD_DAYS,
    language: partial.language ?? DEFAULT_LANGUAGE,
  }
}
