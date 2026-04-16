---
sidebar_position: 2
---

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
    // Provider: 'ollama' | 'anthropic' | 'openai' | 'claude-cli'
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

### Claude CLI (uses your Claude Code session, no API key)

Spawns the local `claude` binary in print mode (`claude -p --output-format json`). Authenticates with whichever account you're signed in as in Claude Code — no `ANTHROPIC_API_KEY` required.

```bash
# Make sure `claude` is on your PATH (see https://docs.claude.com/en/docs/claude-code)
claude --version
```

```ts
llm: { provider: 'claude-cli', model: 'claude-sonnet-4-6', llmThreshold: 0.4 }
```

:::warning[Security]
API keys must be set via environment variables only. Never put them in `ai-notes.config.ts`.
The `claude-cli` provider skips the API-key path entirely — it authenticates via your local Claude Code session.
:::

### Tiered models — premium model for the riskiest files only

Set `highModel` and `highThreshold` to route high-criticality files to a more capable (and more expensive) model while keeping a cheaper default for everything else.

```ts
llm: {
  provider: 'claude-cli',
  model: 'claude-sonnet-4-6',      // default: files with score >= llmThreshold and < highThreshold
  highModel: 'claude-opus-4-6',    // premium: files with score >= highThreshold
  highThreshold: 0.7,              // default 0.7 when highModel is set; ignored otherwise
  llmThreshold: 0.4,               // below this, no LLM at all (static note)
}
```

With this config, a typical run produces three tiers:

| Score range | Output |
|---|---|
| `score < 0.4` | static note (no LLM) |
| `0.4 ≤ score < 0.7` | LLM synthesis via `model` (default tier) |
| `score ≥ 0.7` | LLM synthesis via `highModel` (premium tier) |

The end-of-run summary reports how many files were synthesized at each tier. Works with any provider — mix and match sonnet/opus, gpt-4o-mini/gpt-4o, or llama3/llama3-70b.

## Analysis hints — teach braito about your internal SDKs

The static-analysis layer ships with broad defaults for detecting runtime side effects (observability, message queues, schedulers, realtime channels, caches, feature flags) and outbound API calls (`fetch`, `axios.*`, `got`, `ky`, …). Teams often wrap these behind internal packages — the `analysis` block lets you register those without forking the codebase.

```ts
export default {
  analysis: {
    // Substrings matched case-insensitively against external imports. Merged
    // with the built-in defaults (sentry, datadog, amqp, kafkajs, bullmq, …).
    sideEffectPackages: ['my-corp-tracing', 'internal-queue-client'],

    // Extra regex fragments to detect outbound HTTP/RPC calls. Each fragment
    // should contain one capture group for the URL-like payload. Validated
    // at config-load time.
    apiCallPatterns: [
      "myHttpClient\\.(?:get|post|put|delete)\\s*\\(\\s*['\"]([^'\"]+)['\"]",
    ],
  },
}
```

:::note
These are **hints**, not gates. `hasSideEffects` biases the purpose section of static-only notes, but the criticality score is driven by the graph, git, and test signals — not by a single import.
:::

## Project constitution

Create a `braito.context.md` file at your project root to inject project-specific knowledge into every LLM synthesis prompt. This is optional — the pipeline runs identically without it.

```markdown
# My Project Context

## Domain vocabulary

- **note** — the primary artifact generated per file
- **pipeline** — the full analysis + synthesis chain

## Architecture constraints

- LLM is only called at the synthesis edge — analysis and graph layers are LLM-free
- All providers are swappable via factory.ts

## Risk areas

- Changes to the main schema type may require a schema version bump
- System prompt changes affect all LLM output quality

## Testing notes

- Run tests with `bun test`
- E2e tests use real temp directories
```

When present, braito reads this file (capped at 4 000 chars) and prepends a `## Project context` section to the LLM system prompt. The model uses it to:

- Apply the correct domain vocabulary (e.g. never say "document" when the team calls it a "note")
- Respect architectural constraints when inferring purpose and pitfalls
- Surface the right risk areas in `knownPitfalls` and `sensitiveDependencies`

:::tip
Keep this file under 4 000 characters. Longer content is truncated before being sent to the LLM.
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
