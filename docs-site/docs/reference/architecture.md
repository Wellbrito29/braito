---
sidebar_position: 1
---

# Architecture

## Overview

The pipeline is divided into six main blocks:

1. scanner
2. static analyzer (AST)
3. graph engine
4. git intelligence
5. LLM synthesizer
6. output publisher

## Pipeline

```
repo → scanner → AST analyzer → graph engine → git intelligence
     → [cache check] → static note → [LLM synthesis] → write .json + .md + index
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
- exports
- relevant symbols (functions, classes, interfaces)
- React/Vue hooks
- env var usage
- API calls
- comments: `TODO`, `FIXME`, `HACK`, `INVARIANT`, `DECISION`, `WHY`

Implementation:
- TypeScript/JavaScript: `ts-morph`
- Python: regex-based analyzer
- Go: regex-based analyzer with `go.mod` module path resolution

## 3. Graph Engine

Builds:

- direct dependency graph (who this file imports)
- reverse dependency graph (who imports this file)
- domain grouping
- cycle detection

Import resolution handles relative paths, `tsconfig.paths` aliases, and bundler aliases (Vite, Webpack, Metro).

## 4. Git Intelligence

Crosses historical signals: churn score, recent commit messages, co-changed files, author count.

## 5. Test Intelligence

Maps validation points: related tests by name heuristic, real line coverage from `lcov.info` or `coverage-summary.json`.

## 6. LLM Synthesizer

Receives the file context package and generates all note fields. Rules:

- differentiate observed from inferred
- include evidence
- return confidence scores
- never invent decisions without supporting signals
- fall back to static note on any error or timeout

## 7. Output Publisher

Writes `.ai-notes/<path>.json`, `.ai-notes/<path>.md`, `index.json`, `index.md`.

## Layer breakdown

| Layer | Path | Responsibility |
|---|---|---|
| CLI | `src/cli/` | Command orchestration — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Core | `src/core/` | All business logic |
| Output | `src/core/output/` | JSON/Markdown serialization, index building, BM25 search index |
| Cache | `src/core/cache/` | SHA-1 per file, skip unchanged, stale detection |
| Governance | `src/core/governance/` | Detect project docs (Docs/, Workflows/, Quality/); inject `doc` evidence into notes |

## Key architectural decision

The LLM must stay **at the synthesis edge**, not at the center of the pipeline. Files are only sent to LLM when `criticalityScore >= llmThreshold` (default `0.4`).
