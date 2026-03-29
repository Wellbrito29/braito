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

  // LLM synthesis — uncomment to enable
  // llm: {
  //   provider: 'ollama',
  //   model: 'llama3',
  //   llmThreshold: 0.4,   // only synthesize files with criticalityScore >= this
  //   temperature: 0.2,
  // },

  // For Anthropic:
  // llm: {
  //   provider: 'anthropic',
  //   model: 'claude-sonnet-4-6',
  //   // apiKey: 'sk-ant-...',  // or set ANTHROPIC_API_KEY env var
  //   llmThreshold: 0.4,
  // },
}

export default config
