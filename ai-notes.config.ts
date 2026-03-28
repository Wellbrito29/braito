import type { AiNotesConfig } from './src/core/types/project.ts'

const config: Partial<AiNotesConfig> = {
  include: ['**/*.ts', '**/*.tsx'],
  exclude: [
    'node_modules/**',
    'dist/**',
    '.ai-notes/**',
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/*.d.ts',
  ],
  output: '.ai-notes',
}

export default config
