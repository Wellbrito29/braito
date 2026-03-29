# Changelog

All notable changes to braito will be documented here.

## [Unreleased]

### Added
- **`--filter` flag** — `generate --filter <glob>` scopes note generation to a subdirectory without changing config; full graph is still built from all files for accurate dependency signals (`src/cli/commands/generate.ts`)

### Fixed
- **Alias resolution in watch mode** — `watch.ts` now calls `loadBundlerAliases(root)` and passes aliases to `buildDependencyGraph`, matching the behavior of `generate.ts`; bundler aliases (Vite, Webpack, Metro) are now resolved correctly in watch mode
- **Incremental graph rebuild in watch mode** — `watch.ts` now calls `updateDependencyGraph` (new export) on each file change instead of rebuilding the full graph; only the changed file's dependency entry is updated, then the reverse graph is rebuilt from the patched dep graph
- **Graph test using real temp files** — `buildDependencyGraph.test.ts` now creates actual temp files so `resolveImportPath` can resolve them via `fs.existsSync`; added coverage for `updateDependencyGraph`

### Changed
- **Confidence calibration** — reweighted `computeCriticality` in `buildBasicNote.ts`: hooks raised from `+0.15` to `+0.2`; untested files with consumers now penalized `+0.15` instead of flat `+0.1`; `apiCalls.length > 0` now adds `+0.1` (was not factored in despite being extracted by AST); untested files with no consumers reduced to `+0.05` to avoid over-inflating leaf files

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
