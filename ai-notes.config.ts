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

  llm: {
    provider: 'ollama',
    model: 'deepseek-coder-v2:16b',
    llmThreshold: 0.1,
    temperature: 0.2,
    concurrency: 2,
    timeoutMs: 120_000,
  },
}

export default config
