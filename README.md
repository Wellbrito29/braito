<p align="center">
  <img src="docs/assets/braito.png" alt="Braito — Operational context for codebases" width="600" />
</p>

<p align="center">
  <strong>Operational context for codebases.</strong><br/>
  Braito analyzes TypeScript/JavaScript repos and generates structured knowledge sidecars per file — powered by static analysis, git intelligence, and optional LLM synthesis.
</p>

<p align="center">
  <img alt="Built with Bun" src="https://img.shields.io/badge/built%20with-Bun-f9f1e1?logo=bun&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white" />
  <img alt="Status" src="https://img.shields.io/badge/status-operational-brightgreen" />
</p>

<p align="center">
  <a href="https://wellbrito29.github.io/braito/">Documentation</a> &nbsp;·&nbsp;
  <a href="README.pt-BR.md">Leia em Português</a>
</p>

---

## What it does

Braito scans your codebase and generates a `.ai-notes/` directory with one `.json` + `.md` sidecar per file. Each note contains:

| Field | Description |
|---|---|
| `purpose` | What the file does |
| `invariants` | Contracts and assumptions that must hold |
| `sensitiveDependencies` | Risky imports, env vars, external APIs |
| `importantDecisions` | Non-obvious architectural choices |
| `knownPitfalls` | Common failure modes |
| `impactValidation` | Where to verify before shipping — including real coverage data |
| `criticalityScore` | 0–1 heuristic — drives LLM prioritization |

Every field separates **`observed`** (static analysis, git, tests) from **`inferred`** (LLM synthesis). No hallucination hiding in the facts.

---

## Pipeline

```
repo → scanner → AST analyzer → graph engine → git intelligence
     → [cache check] → static note → [LLM synthesis] → .ai-notes/
```

**Key constraint:** LLM is only invoked when `criticalityScore >= llmThreshold` (default `0.4`). The rest of the pipeline is fully deterministic and auditable.

---

## Quickstart

```bash
bun install
bun run scan              # discover files
bun run generate          # full pipeline → .ai-notes/
bun run generate:force    # bypass cache
bun run generate:dry      # preview without writing
bun run generate:v        # verbose — per-file signals + phase timers
bun run watch             # regenerate on file change
bun run ui                # web UI at http://localhost:7842
bun run mcp               # MCP server (Cursor / Claude Code)
bun run init:agent        # generate .claude/commands/ slash commands
bun test
```

---

## Configuration

Create an `ai-notes.config.ts` at the root of your project:

```ts
// Ollama — local, no API key needed
export default {
  llm: { provider: 'ollama', model: 'llama3', llmThreshold: 0.4, temperature: 0.2 },
  language: 'en',
}

// Anthropic — set ANTHROPIC_API_KEY env var
export default {
  llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4 },
  language: 'pt-BR',
}

// OpenAI — set OPENAI_API_KEY env var
export default {
  llm: { provider: 'openai', model: 'gpt-4o', llmThreshold: 0.4 },
}
```

> **Security:** API keys must be set via environment variables only. Never put them in `ai-notes.config.ts`.

**Multi-language output** — LLM-synthesized content (`inferred` fields) is generated in the configured language. The `--language` CLI flag overrides the config:

```bash
bun src/cli/index.ts generate --root ./ --language pt-BR
bun src/cli/index.ts generate --root ./ --language es
```

Supported: any BCP 47 language tag (`en`, `pt-BR`, `es`, `fr`, `de`, etc.).

**Stale note detection:**

```ts
export default { staleThresholdDays: 14 }
```

**Multi-language source support** — Python and Go opt-in:

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'
export default { include: MULTI_LANGUAGE_INCLUDE }
```

---

## Generated output

```
.ai-notes/
  src/
    core/
      scanner/discoverFiles.ts.json
      scanner/discoverFiles.ts.md
  index.json
  index.md

cache/
  hashes.json
```

---

## MCP server

```bash
bun src/cli/index.ts mcp --root ./
```

| Tool | Description |
|---|---|
| `get_overview` | High-level project overview — domains, entry points, most critical files |
| `get_file_note` | Get the full note for a specific file |
| `get_index` | Get the full ranked index |
| `get_impact` | Blast radius of a file — transitive dependents with optional notes |
| `search` | Full-text search across all note fields |
| `get_domain` | All files in a domain, sorted by criticality |
| `search_by_criticality` | List files above a criticality threshold |
| `get_architecture_context` | Synthesized architectural overview — top files, domain breakdown, stats |
| `get_business_rules` | Extract business rules, domain constraints, and policy enforcement patterns from a source file |

Add to your MCP client config (e.g. `~/.cursor/mcp.json` or `~/.claude/config.json`):

```json
{
  "mcpServers": {
    "braito": {
      "command": "bun",
      "args": ["src/cli/index.ts", "mcp", "--root", "/path/to/your/project"]
    }
  }
}
```

---

## Web UI

```bash
bun src/cli/index.ts ui --root ./
# → http://localhost:7842
```

---

## VS Code Extension

The `vscode-extension/` directory contains a native VS Code extension:

- **File decorations** — `⚡` on high-criticality files, `⚠` on stale notes
- **Hover provider** — hovering over an import shows the purpose and criticality of the imported file
- **Command:** `braito: Show Note for Current File`

---

## Architecture

| Layer | Path | Responsibility |
|---|---|---|
| CLI | `src/cli/` | Command orchestration — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Scanner | `src/core/scanner/` | File discovery via `Bun.Glob` |
| AST | `src/core/ast/` | `ts-morph` for TS/JS; Python and Go analyzers |
| Graph | `src/core/graph/` | Dependency graphs; bundler alias resolution; cycle detection |
| Git | `src/core/git/` | Churn score, recent commits, co-changed files |
| Tests | `src/core/tests/` | Test discovery; lcov/c8 coverage integration |
| Cache | `src/core/cache/` | SHA-1 per file, stale detection |
| LLM | `src/core/llm/` | Provider abstraction, retry/timeout, prompt builder, Zod validation |
| Output | `src/core/output/` | JSON/Markdown serialization, domain-grouped index |

---

## CI integration

`.github/workflows/ai-notes.yml` triggers on push to `main`/`master` when source files change. Requires `fetch-depth: 0` for accurate git signals.

---

## Principles

1. **Static analysis first** — LLM enriches, not replaces.
2. **Reduced context per file** — never send the entire repo to the model.
3. **Observed vs inferred** — always separated, always explicit.
4. **Sidecar, not inline** — notes live in `.ai-notes/`, not as code comments.
5. **Criticality-driven** — high-churn, high-consumer, hook-heavy files are prioritized.
