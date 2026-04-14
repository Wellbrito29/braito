---
sidebar_position: 1
---

# Architecture

## Overview

The pipeline is divided into the following blocks:

1. scanner
2. static analyzer (AST)
3. graph engine
4. git intelligence
5. test intelligence
6. cache layer
7. governance context loader
8. LLM synthesizer (edge only)
9. output publisher
10. business-rule extractor (on-demand, via MCP)

## Pipeline

```
repo → scanner → AST analyzer → graph engine → git intelligence
     → [cache check] → governance context → static note
     → [LLM synthesis if criticalityScore ≥ llmThreshold]
     → write .json + .md + index + graph.json + search-index.json
```

**Key constraint:** LLM sits at the synthesis edge only. The majority of the pipeline is deterministic and auditable.

## 1. Scanner

Responsibilities:

- discover eligible files via `Bun.Glob`
- apply include/exclude patterns
- respect ignore rules
- classify domain from folder structure

Output: list of candidate files with path, extension, size.

## 2. Static Analyzer (AST)

Extracts facts from source code:

- imports (static + dynamic `import()`)
- exports with full signatures and JSDoc (`exportDetails`)
- relevant symbols (functions, classes, interfaces)
- React/Vue hooks
- env var usage
- API calls (literal URLs passed to `fetch`/`axios`/`got`/`request`)
- comments: `TODO`, `FIXME`, `HACK`, `INVARIANT`, `DECISION`, `WHY`, `ENSURES`, `ADR`
- type signatures (`extractSignatures` — function params+return, interface fields, type aliases)

Implementation:

- TypeScript/JavaScript: `ts-morph` with per-extractor files under `analyzers/ts/`
- Python: regex-based analyzer (`__all__` honored; multiline imports handled)
- Go: regex-based analyzer with `go.mod` module path resolution; captures methods with receivers

## 3. Graph Engine

Builds:

- direct dependency graph (who this file imports)
- reverse dependency graph (who imports this file)
- domain grouping
- cycle detection

Import resolution handles relative paths, `tsconfig.paths` aliases, and bundler aliases (Vite, Webpack, Metro). Graph is persisted to `.ai-notes/graph.json` for later transitive queries by the MCP `get_impact` tool.

## 4. Git Intelligence

Crosses historical signals via the `git` CLI: churn score, recent commit messages, co-changed files, author count.

## 5. Test Intelligence

Maps validation points: related tests by name heuristic, real line coverage from `lcov.info` or `coverage-summary.json`.

## 6. Cache Layer

SHA-1 per file in `cache/hashes.json`. Incremental runs skip ts-morph parsing and LLM synthesis when the file hash is unchanged. `isNoteStale` flags notes older than `staleThresholdDays` (default 30).

## 7. Governance Context

`src/core/governance/` detects project documentation (`Docs/brief.md`, `Docs/architecture.md`, `Workflows/`, `Quality/`, `Skills/`, `ADR/`) and builds a `GovernanceContext`. `buildBasicNote` links files to their governing docs via `evidence.type: 'doc'`. Exposed to agents via the `get_governance_context` MCP tool.

## 8. LLM Synthesizer

Receives the file context package and generates all note `inferred` fields. Rules:

- differentiate `observed` from `inferred`
- include evidence with typed sources
- return confidence scores
- never invent decisions without supporting signals
- fall back to static note on any error or timeout

File-type detection routes type-definition files (`*.types.ts`, `*.dto.ts`, etc.) through a specialized prompt. `braito.context.md` (optional) is prepended to every prompt as project constitution.

## 9. Output Publisher

Writes `.ai-notes/<path>.json`, `.ai-notes/<path>.md`, `index.json`, `index.md`, `graph.json`, and `search-index.json` (BM25 via MiniSearch).

## 10. Business-Rule Extractor

`src/core/business/extractBusinessRules.ts` is invoked on demand by the `get_business_rules` MCP tool. Extracts numeric limits, permission guards, schema validations, business constants, and conditional throws from a single file without running the full pipeline.

## Layer breakdown

| Layer | Path | Responsibility |
|---|---|---|
| CLI | `src/cli/` | Command orchestration — `scan`, `generate`, `watch`, `mcp`, `ui`, `init`, `update` |
| Core | `src/core/` | All business logic |
| Output | `src/core/output/` | JSON/Markdown serialization, index, graph persistence, BM25 search index |
| Cache | `src/core/cache/` | SHA-1 per file, skip unchanged, stale detection |
| Governance | `src/core/governance/` | Detect project docs (Docs/, Workflows/, Quality/); inject `doc` evidence into notes |
| Business | `src/core/business/` | Static heuristic extractors for domain rules (consumed on demand by MCP) |

## Key architectural decision

The LLM must stay **at the synthesis edge**, not at the center of the pipeline. Files are only sent to LLM when `criticalityScore >= llmThreshold` (default `0.4`).
