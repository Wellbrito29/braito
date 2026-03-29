# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**braito** (AI File Notes) is a TypeScript CLI tool that analyzes codebases and generates operational knowledge sidecars (`.json` + `.md`) per file. It targets dense TypeScript/JavaScript monorepos and teams using AI for code review, onboarding, and maintenance.

**All 4 phases are implemented.** The tool is fully operational.

## CLI Commands

```bash
bun install                                        # install dependencies
bun src/cli/index.ts scan --root ./                # discover and list eligible files
bun src/cli/index.ts generate --root ./            # full pipeline — writes .ai-notes/
bun src/cli/index.ts generate --root ./ --force    # bypass cache, reprocess all files
bun src/cli/index.ts watch --root ./               # watch mode — regenerates on file change
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
| CLI | `src/cli/` | Command orchestration — `scan`, `generate`, `watch` |
| Core | `src/core/` | All business logic |
| Output | `src/core/output/` | JSON/Markdown serialization, sidecar writing, index building |
| Cache | `src/core/cache/` | SHA-1 hash per file, skip unchanged files |

### Core modules

- **`core/scanner/`** — file discovery with `Bun.Glob`, include/exclude/ignore rules
- **`core/ast/`** — `ts-morph` based; extractors for imports, exports, symbols, hooks, comments (TODO/FIXME/HACK), env vars, API calls
- **`core/graph/`** — direct + reverse dependency graphs; `resolveImportPath` handles relative paths and `tsconfig.paths` aliases
- **`core/git/`** — churn score, recent commit messages, co-changed files, author count via `git` CLI + `Bun.spawnSync`
- **`core/tests/`** — heuristic test discovery by name, `__tests__` folder proximity
- **`core/cache/`** — SHA-1 hash per file, `cache/hashes.json`, skip unchanged files between runs
- **`core/llm/`** — provider abstraction (`ollama`, `anthropic`, `openai`), prompt builder, Zod schema validation, merge strategy
- **`core/output/`** — `buildBasicNote`, `writeJsonNote`, `writeMarkdownNote`, `buildIndex`, `writeIndexNote`

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
- `.ai-notes/index.json` — all files ranked by criticality
- `.ai-notes/index.md` — Markdown table with links
- `cache/hashes.json` — SHA-1 per file for incremental runs

Do not edit `.ai-notes/` or `cache/` manually.

## CI

`.github/workflows/ai-notes.yml` triggers on push to `main`/`master` when source files change. Requires full git history (`fetch-depth: 0`) for accurate git signals. Supports `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` as repository secrets.

---

## Next Steps

### Short-term improvements

**Alias resolution** — `resolveImportPath.ts` currently reads `tsconfig.paths` but does not handle bundler aliases (Vite, Webpack, Metro). Needed for accurate graphs in monorepos with custom path mappings.

**Incremental graph rebuild** — currently the full dependency graph is rebuilt on every run even when using cache. In watch mode this is fine, but for large repos a partial rebuild (only affected files + their consumers) would be faster.

**`--filter` flag** — allow `generate --filter packages/search/**` to scope the pipeline to a subdirectory or domain without changing config.

**Confidence calibration** — the heuristic `criticalityScore` thresholds were set conservatively. After running against real monorepos, these weights should be tuned based on observed false positives/negatives.

### Medium-term features

**Markdown output for `invariants` and `importantDecisions`** — these fields are currently only filled by LLM. A heuristic pre-fill pass (pattern matching in comments, ADR files, changelog) would improve coverage even without LLM.

**Domain grouping** — group files by folder/package in `index.md`, not just a flat ranked list. Useful for monorepos where each package has its own criticality context.

**Stale note detection** — flag notes whose `generatedAt` is older than N days or whose source file has changed since last synthesis, prompting re-synthesis.

**Test coverage hints** — integrate with coverage reports (lcov, c8) to surface actual uncovered files in `impactValidation`, not just heuristic test discovery.

### Long-term / Phase 5 candidates

**Multi-language support** — the AST layer was designed to be modular per language (`core/ast/analyzers/`). Adding Python (via tree-sitter) or Go support follows the same extractor pattern.

**MCP server** — expose braito as a Model Context Protocol server so AI assistants (Cursor, Claude) can query notes about specific files on demand during code review.

**Interactive UI** — a `bun src/cli/index.ts ui` command serving a local web interface to browse the index, filter by domain/score, and trigger re-synthesis.
