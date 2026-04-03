# Configuration Example

Full reference for `ai-notes.config.ts` at the project root.

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'

export default {
  // Project root (defaults to process.cwd())
  root: process.cwd(),

  // Files to include — TypeScript/JavaScript only by default
  include: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],

  // Or opt in to Python and Go:
  // include: MULTI_LANGUAGE_INCLUDE,

  // Files to exclude
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.generated.*',
    '**/coverage/**',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],

  // Output directory for .ai-notes/
  output: '.ai-notes',

  // Path to tsconfig.json (auto-detected if omitted)
  tsconfigPath: './tsconfig.json',

  // Notes older than this are flagged as stale
  staleThresholdDays: 30,

  // Language for LLM-synthesized content (BCP 47 tag, default: 'en')
  // Controls the language of all inferred fields (observed, inferred, evidence details).
  // Examples: 'pt-BR', 'es', 'fr', 'de'
  // Can also be set via --language CLI flag (flag takes priority over config)
  language: 'en',

  // LLM configuration (optional — omit to use static-only notes)
  llm: {
    // Provider: 'ollama' | 'anthropic' | 'openai'
    provider: 'anthropic',

    // Model name
    model: 'claude-sonnet-4-6',

    // Files with criticalityScore >= llmThreshold are sent to LLM
    llmThreshold: 0.4,

    // Sampling temperature (0–2, lower = more deterministic)
    temperature: 0.2,

    // Per-file synthesis timeout in milliseconds (default: 30000)
    timeoutMs: 30000,

    // Max parallel LLM calls (default: 5)
    concurrency: 5,
  },
}
```

**Security:** API keys must be set via environment variables only:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
```

Never put API keys in `ai-notes.config.ts`.
