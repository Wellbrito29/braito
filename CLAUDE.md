# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**braito** (AI File Notes) is a TypeScript CLI tool that analyzes codebases and generates operational knowledge sidecars (`.json` + `.md`) per file. It targets dense TypeScript/JavaScript monorepos and teams using AI for code review, onboarding, and maintenance.

This project is currently in the **documentation/planning phase** — no source code exists yet. The `docs/` directory contains the full design.

## Planned CLI Commands

Once implemented, the tool will be invoked as:

```bash
ai-notes scan       # discover eligible files
ai-notes generate   # run analysis and synthesize notes
ai-notes publish    # write .json and .md sidecars
ai-notes watch      # incremental watch mode
```

## Architecture

The pipeline flows linearly:

```
repo → scanner → static analyzer → graph engine → git intelligence
     → test intelligence → context builder → llm synthesizer → publisher
```

Key design constraint: **LLM sits at the synthesis edge only** — the majority of the pipeline is deterministic and auditable. Never send the full repo to the model; send minimal, evidence-rich context per file.

### Layer breakdown

| Layer | Path | Responsibility |
|---|---|---|
| CLI | `src/cli/` | Command orchestration only, no business logic |
| Core | `src/core/` | All business logic — parsing, graph, git, context, ranking |
| Output | `src/core/output/` | JSON/Markdown serialization, sidecar writing, index building |

### Core modules

- **`core/scanner/`** — file discovery with include/exclude/ignore rules
- **`core/ast/`** — modular by language; MVP targets TS/TSX via `ts-morph` or TypeScript Compiler API; designed for future language expansion
- **`core/graph/`** — direct + reverse dependency graphs; central to impact/criticality scoring
- **`core/git/`** — churn scores, recent commits, co-changed files, blame hints
- **`core/tests/`** — maps related tests by name, imports, folder proximity, co-change
- **`core/context/`** — assembles `FileContextPacket` per file; no parsing logic here
- **`core/llm/`** — separated into: provider, prompts, schemas, synthesizer
- **`core/ranking/`** — criticality and confidence scoring

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
  criticalityScore: number
  generatedAt: string
  model: string
}
```

### Structured fields always contain

```ts
type StructuredListField = {
  observed: string[]   // facts extracted from code/git/tests
  inferred: string[]   // LLM conclusions
  confidence: number   // 0–1
  evidence: EvidenceItem[]  // type: 'code' | 'git' | 'test' | 'graph' | 'comment' | 'doc'
}
```

This `observed`/`inferred` split is mandatory — never collapse them.

## Implementation Phases

| Phase | Focus |
|---|---|
| 1 (MVP) | Scanner, TS/TSX parser, imports/exports, dependency graph, test discovery, JSON sidecar |
| 2 | Git signals (churn, co-change, commit messages), criticality scoring |
| 3 | LLM integration, Markdown sidecar, full structured schema |
| 4 | Cache by hash, watch mode, CI integration, domain filters |

## Generated Output

- `.ai-notes/` — generated sidecars; **do not edit manually**
- `cache/` — intermediate hashes and results to avoid recomputation

## Key Design Principles

1. Base everything on static analysis first; LLM enriches at the end
2. Always separate `observed` from `inferred` to reduce hallucination
3. Every conclusion must carry `confidence` and `evidence`
4. Sidecar-first approach — avoid inline code comments
5. Prioritize: central hooks, adapters, gateways, high-churn files, reducers/stores, shared modules
