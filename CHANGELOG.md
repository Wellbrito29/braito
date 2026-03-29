# Changelog

All notable changes to braito will be documented here.

## [Unreleased]

## [1.0.0] — 2026-03-29

### Added
- **Phase 1 — Scanner**: File discovery with `Bun.Glob`, include/exclude/ignore rules (`src/core/scanner/`)
- **Phase 2 — Static Analyzer**: `ts-morph` based AST extractors for imports, exports, symbols, hooks, comments (TODO/FIXME/HACK), env vars, API calls (`src/core/ast/`)
- **Phase 2 — Graph Engine**: Direct + reverse dependency graphs; `resolveImportPath` handles relative paths and `tsconfig.paths` aliases (`src/core/graph/`)
- **Phase 2 — Git Intelligence**: Churn score, recent commit messages, co-changed files, author count via `git` CLI + `Bun.spawnSync` (`src/core/git/`)
- **Phase 3 — Cache**: SHA-1 hash per file, `cache/hashes.json`, skip unchanged files between runs (`src/core/cache/`)
- **Phase 3 — LLM Layer**: Provider abstraction for `ollama`, `anthropic`, `openai`; prompt builder, Zod schema validation, merge strategy (`src/core/llm/`)
- **Phase 4 — Output**: `buildBasicNote`, `writeJsonNote`, `writeMarkdownNote`, `buildIndex`, `writeIndexNote` (`src/core/output/`)
- **CLI**: Commands `scan`, `generate` (with `--force`), `watch` (`src/cli/`)
- **CI**: GitHub Actions workflow `.github/workflows/ai-notes.yml`
- **Domain model**: `AiFileNote` with `observed`/`inferred` split per `StructuredListField`
- **Test suites**: Full test coverage via `bun test`
