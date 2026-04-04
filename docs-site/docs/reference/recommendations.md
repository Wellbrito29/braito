---
sidebar_position: 5
---

# Recommendations

## Technical

### 1. TypeScript first

Even if the architecture allows future expansion, the MVP focuses on TS/TSX. Python and Go are supported via opt-in.

### 2. Use `ts-morph` for TypeScript

It greatly simplifies extraction of imports, exports, symbols, and basic navigation without forcing you to deal with low-level Compiler API details too early.

### 3. Sidecar before inline

Generate `.md` and `.json` in `.ai-notes/`. Only then consider inline headers at the top of files (if at all).

### 4. Don't generate for everything at once

Prioritize:

- high churn
- many dependents
- central services
- shared hooks
- files without tests
- API/analytics/env integrations

### 5. Treat `importantDecisions` with skepticism

This field is the most prone to hallucination. Only fill it with high confidence when there is:

- an explicit comment
- domain documentation
- a strong commit message
- a very obvious pattern

### 6. Separate fact from inference

This is essential for operational confidence. Never deliver only polished prose.

### 7. Keep everything auditable

Every note should be explainable by:

- a code snippet
- a graph relationship
- a found test
- a comment
- a commit

### 8. Resolve aliases early

Monorepos typically depend on:

- `tsconfig paths`
- bundler aliases
- workspace packages

Without this, the dependency graph is incomplete.

## Product

### 1. Think of it as a support tool, not absolute truth

The notes should guide, not replace technical judgment.

### 2. Show confidence and evidence in the UI or output

This increases adoption and reduces distrust.

### 3. Have incremental mode

Large projects cannot reprocess everything on every run.

### 4. Generate criticality index

This helps focus first on the most valuable files.

## Operational

### 1. Cache is mandatory

Cache by file hash + signals. This reduces cost and time.

### 2. Ignore generated files and noise

Filter:

- `node_modules`
- `dist`, `build`
- snapshots
- generated files
- coverage output

### 3. CI only after the pipeline stabilizes

First run locally and adjust quality. Then bring to CI.

### 4. Have a fallback without LLM

The system should remain useful even when the provider fails. Static notes are always generated first.
