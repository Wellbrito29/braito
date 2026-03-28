import type { AiNotesConfig } from '../types/project.ts'

export const DEFAULT_INCLUDE = ['**/*.ts', '**/*.tsx']

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

export function withDefaults(partial: Partial<AiNotesConfig> & { root: string }): AiNotesConfig {
  return {
    root: partial.root,
    include: partial.include ?? DEFAULT_INCLUDE,
    exclude: partial.exclude ?? DEFAULT_EXCLUDE,
    output: partial.output ?? '.ai-notes',
    tsconfigPath: partial.tsconfigPath,
  }
}
