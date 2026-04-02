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

export function withDefaults(partial: Partial<AiNotesConfig> & { root: string }): AiNotesConfig {
  return {
    root: partial.root,
    include: partial.include ?? DEFAULT_INCLUDE,
    exclude: partial.exclude ?? DEFAULT_EXCLUDE,
    output: partial.output ?? '.ai-notes',
    tsconfigPath: partial.tsconfigPath,
    llm: partial.llm,
    staleThresholdDays: partial.staleThresholdDays ?? DEFAULT_STALE_THRESHOLD_DAYS,
  }
}
