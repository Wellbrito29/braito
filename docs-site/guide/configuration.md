# Configuration

Create `ai-notes.config.ts` at your project root. All fields are optional.

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'

export default {
  // ─── Scope ────────────────────────────────────────────────────────────────

  // Files to include (TypeScript/JavaScript by default)
  include: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],

  // Opt in to Python and Go:
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

  // ─── Output ───────────────────────────────────────────────────────────────

  // Directory for generated notes (default: '.ai-notes')
  output: '.ai-notes',

  // Path to tsconfig.json (auto-detected if omitted)
  tsconfigPath: './tsconfig.json',

  // Notes older than this are flagged as stale in the index
  staleThresholdDays: 30,

  // ─── Language ─────────────────────────────────────────────────────────────

  // BCP 47 language tag for LLM-synthesized content (default: 'en')
  // The --language CLI flag overrides this value.
  language: 'en',

  // ─── LLM ──────────────────────────────────────────────────────────────────

  llm: {
    // Provider: 'ollama' | 'anthropic' | 'openai'
    provider: 'anthropic',

    // Model name
    model: 'claude-sonnet-4-6',

    // Only files with criticalityScore >= this threshold are sent to the LLM
    llmThreshold: 0.4,

    // Sampling temperature (lower = more deterministic)
    temperature: 0.2,

    // Per-file LLM timeout in milliseconds
    timeoutMs: 30000,

    // Max parallel LLM calls
    concurrency: 5,
  },
}
```

## Provider setup

### Anthropic

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

```ts
llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4 }
```

### OpenAI

```bash
export OPENAI_API_KEY=sk-...
```

```ts
llm: { provider: 'openai', model: 'gpt-4o', llmThreshold: 0.4 }
```

### Ollama (local, no API key)

```bash
ollama pull llama3
```

```ts
llm: { provider: 'ollama', model: 'llama3', llmThreshold: 0.4, temperature: 0.2 }
```

::: warning Security
API keys must be set via environment variables only. Never put them in `ai-notes.config.ts`.
:::

## Multi-language output

The `language` field controls the language of all LLM-synthesized content (`inferred[]` arrays and evidence details). The CLI flag takes priority over the config:

```bash
# Spanish output
bun src/cli/index.ts generate --root ./ --language es

# Portuguese (Brazil)
bun src/cli/index.ts generate --root ./ --language pt-BR
```

Supported: any valid BCP 47 tag (`en`, `pt-BR`, `es`, `fr`, `de`, `ja`, etc.).

## Criticality score

The `criticalityScore` (0–1) is computed from static signals:

| Signal | Max contribution |
|---|---|
| Reverse dependency count | +0.40 |
| Exports React/Vue hooks | +0.20 |
| External imports | +0.10 |
| Env var usage | +0.10 |
| Outbound API calls | +0.10 |
| No tests (+ has consumers) | +0.15 |
| High churn (git commits) | +0.15 |
| TODO/FIXME/HACK comments | +0.05 |
| Multiple authors | +0.05 |

Files at or above `llmThreshold` are sent to the LLM. The rest get a fast static note.
