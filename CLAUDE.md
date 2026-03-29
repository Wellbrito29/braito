# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**braito** (AI File Notes) is a TypeScript CLI tool that analyzes codebases and generates operational knowledge sidecars (`.json` + `.md`) per file. It targets dense TypeScript/JavaScript monorepos and teams using AI for code review, onboarding, and maintenance.

**All phases are implemented, including Phase 5.** The tool is fully operational.

## CLI Commands

```bash
bun install                                        # install dependencies
bun src/cli/index.ts scan --root ./                # discover and list eligible files
bun src/cli/index.ts generate --root ./            # full pipeline — writes .ai-notes/
bun src/cli/index.ts generate --root ./ --force    # bypass cache, reprocess all files
bun src/cli/index.ts generate --root ./ --filter src/core/**  # scope to subdirectory
bun src/cli/index.ts watch --root ./               # watch mode — regenerates on file change
bun src/cli/index.ts mcp --root ./                 # MCP server (JSON-RPC 2.0 over stdio)
bun src/cli/index.ts ui --root ./                  # local web UI at http://localhost:7842
bun test                                           # run all test suites
```

## Architecture

The pipeline flows linearly:

```
repo → scanner → static analyzer → graph engine → git intelligence
     → [cache check] → static note → [LLM synthesis] → write .json + .md + index
```

**Key constraint:** LLM sits at the synthesis edge only. The majority of the pipeline is deterministic and auditable. Files are only sent to LLM when `criticalityScore >= llmThreshold` (default `0.4`).

### Layer breakdown

| Layer | Path | Responsibility |
|---|---|---|
| CLI | `src/cli/` | Command orchestration — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Core | `src/core/` | All business logic |
| Output | `src/core/output/` | JSON/Markdown serialization, sidecar writing, index building |
| Cache | `src/core/cache/` | SHA-1 hash per file, skip unchanged files, stale detection |

### Core modules

- **`core/scanner/`** — file discovery with `Bun.Glob`, include/exclude/ignore rules
- **`core/ast/`** — `ts-morph` for TS/JS; `LanguageAnalyzer` interface + registry for multi-language; Python and Go analyzers included; extractors for imports, exports, symbols, hooks, comments (TODO/FIXME/HACK/INVARIANT/DECISION), env vars, API calls
- **`core/graph/`** — direct + reverse dependency graphs; `resolveImportPath` handles relative paths, `tsconfig.paths` aliases, and bundler aliases (Vite, Webpack, Metro); `updateDependencyGraph` for incremental watch-mode rebuilds
- **`core/git/`** — churn score, recent commit messages, co-changed files, author count via `git` CLI + `Bun.spawnSync`
- **`core/tests/`** — heuristic test discovery; `loadCoverage` reads `lcov.info` or `coverage-summary.json` for real line coverage
- **`core/cache/`** — SHA-1 hash per file, `cache/hashes.json`, skip unchanged files; `isNoteStale` flags notes older than `staleThresholdDays` (default 30)
- **`core/llm/`** — provider abstraction (`ollama`, `anthropic`, `openai`), prompt builder, Zod schema validation, merge strategy
- **`core/output/`** — `buildBasicNote` (with heuristic invariants/decisions pre-fill), `writeJsonNote`, `writeMarkdownNote`, `buildIndex` (domain-grouped), `writeIndexNote`

## Domain Model

### Primary output type

```ts
type AiFileNote = {
  filePath: string
  purpose: StructuredListField
  invariants: StructuredListField
  sensitiveDependencies: StructuredListField
  importantDecisions: StructuredListField
  knownPitfalls: StructuredListField
  impactValidation: StructuredListField
  criticalityScore: number   // 0–1, heuristic based on consumers, churn, hooks, tests
  generatedAt: string
  model: string              // "static" | "<llm-model-name>"
}

type StructuredListField = {
  observed: string[]         // facts from static analysis / git / tests
  inferred: string[]         // LLM synthesis (empty when model = "static")
  confidence: number         // 0–1
  evidence: EvidenceItem[]   // type: 'code' | 'git' | 'test' | 'graph' | 'comment' | 'doc'
}
```

The `observed`/`inferred` split is mandatory — never collapse them.

## LLM Configuration

Configure in `ai-notes.config.ts`. Provider is dynamic — swap without changing the pipeline.

```ts
// Ollama (local, no API key needed)
llm: { provider: 'ollama', model: 'llama3', llmThreshold: 0.4, temperature: 0.2 }

// Anthropic
llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4 }
// or set ANTHROPIC_API_KEY env var

// OpenAI
llm: { provider: 'openai', model: 'gpt-4o', llmThreshold: 0.4 }
// or set OPENAI_API_KEY env var
```

LLM synthesis only runs for files where `criticalityScore >= llmThreshold`. Fallback to static note on any LLM error.

## Generated Output

- `.ai-notes/<relative-path>.json` — structured note per file
- `.ai-notes/<relative-path>.md` — human-readable sidecar
- `.ai-notes/index.json` — all files ranked by criticality, with domain and stale flags
- `.ai-notes/index.md` — grouped by domain, avg score per group, stale marker ⚠
- `cache/hashes.json` — SHA-1 per file for incremental runs

Do not edit `.ai-notes/` or `cache/` manually.

## Multi-language Support

Python (`.py`) and Go (`.go`) are supported via regex-based analyzers. Opt in via `ai-notes.config.ts`:

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'
export default { include: MULTI_LANGUAGE_INCLUDE }
```

To add a new language, implement `LanguageAnalyzer` (`src/core/ast/types.ts`) and register it in `analyzerRegistry.ts`.

## MCP Server

Exposes braito notes as tools for AI assistants (Cursor, Claude Code):

```bash
bun src/cli/index.ts mcp --root ./
```

Tools: `get_file_note`, `search_by_criticality`, `get_index`.

## CI

`.github/workflows/ai-notes.yml` triggers on push to `main`/`master` when source files change. Requires full git history (`fetch-depth: 0`) for accurate git signals. Supports `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` as repository secrets.

---

## Project Tracking

- **`TODO.md`** — pending next steps, grouped by short/medium/long-term
- **`CHANGELOG.md`** — record of all completed work

## Changelog Rule

**Every time a feature, fix, or improvement is completed, update `CHANGELOG.md` immediately.**

- Add the entry under `[Unreleased]` with the appropriate category (`Added`, `Changed`, `Fixed`, `Removed`)
- When a TODO item is completed, check it off in `TODO.md` and add the corresponding entry to `CHANGELOG.md`
- Use the format: `- **Feature name** — brief description of what was done`

## README Rule

**When a new command, feature, or configuration option is added, update `README.md` to reflect it.**

- Keep the CLI commands section, architecture table, and configuration examples in sync with the actual implementation
- Do not let the README describe a subset of what the tool can do

## Git Conventions

**Never include "claude" in commit messages or branch names.**

- Do not sign commits with "claude", "Claude", or any AI assistant identifier
- Do not prefix branch names with `claude/` — use descriptive names based on the feature or fix (e.g. `feat/alias-resolution`, `fix/incremental-graph`)
- Commit messages must reflect the work done, not who or what did it
