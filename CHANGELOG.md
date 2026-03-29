# Changelog

All notable changes to braito will be documented here.

## [Unreleased]

### Added
- **LLM synthesis timeout** — `synthesizeFileNote` accepts a `timeoutMs` parameter (default 30 000 ms); `Promise.race` races the provider call against a timeout reject, falling back to the static note automatically via the existing catch block; configurable via `llm.timeoutMs` in `ai-notes.config.ts`; `LLMConfig` type and `llmConfigSchema` updated accordingly
- **Config validation** — `loadConfig` now validates `ai-notes.config.ts` with a Zod schema (`src/core/config/configSchema.ts`); invalid values (unknown provider, out-of-range threshold/temperature, empty output dir, non-positive staleThresholdDays) emit a clear error with field paths instead of silently falling back to defaults; 15 tests added (`tests/config/configSchema.test.ts`)
- **Temperature bug fix** — confirmed `provider/anthropic.ts` and `provider/openai.ts` correctly pass `request.temperature` through the `LLMRequest` type; marked resolved
- **Logger upgrade** — replaced simple logger with a structured `Logger` class supporting `debug`, `info`, `warn`, `error`, `silent` levels; `--debug` flag enables debug-level output with timestamps; `--verbose` / `-v` enables debug without timestamps; `--silent` suppresses all output except errors; `logger.debug()` calls added throughout `generate`, `scan`, and `watch` commands for per-file cache hits, graph stats, LLM decisions, and alias counts; 16 tests added (`tests/utils/logger.test.ts`)
- **`scan --format json|table`** — `scan --format json` outputs a machine-readable JSON array with `path`, `extension`, and `size` per file; `--format table` (default) preserves the existing indented list format; enables piping scan results to external tools
- **Dynamic import detection** — `extractImports.ts` now detects `import('./path')` calls using ts-morph `CallExpression` traversal; dynamic imports are included in the same `imports` array as static imports, making lazy-loaded dependencies visible in the dependency graph; static string and no-substitution template literal specifiers are supported; template literals with runtime expressions are safely ignored
- **`--filter` flag** — `generate --filter <glob>` scopes note generation to a subdirectory without changing config; full graph is still built from all files for accurate dependency signals (`src/cli/commands/generate.ts`)
- **Heuristic pre-fill for `invariants` and `importantDecisions`** — `extractComments` now captures `INVARIANT/CONTRACT/ASSERT` and `NOTE/DECISION/WHY/REASON` comment patterns; `buildBasicNote` uses them plus structural signals (validation libs, env vars, hooks rules, decision-flavoured commit messages) to populate both fields without LLM
- **Domain grouping in `index.md`** — `buildIndex` now derives a `domain` per entry (first dir segment, or `packages/<name>` for monorepo roots); `renderIndexMarkdown` renders one section per domain sorted by max criticality, each with file count and avg score
- **Stale note detection** — `isNoteStale` utility checks `generatedAt` age against a configurable `staleThresholdDays` (default 30); `NoteIndex` gains `staleFiles` count; `index.md` marks stale entries with ⚠; `generate` logs a warning when stale notes are found; threshold configurable via `ai-notes.config.ts`
- **Test coverage hints** — `parseLcov` and `loadCoverage` load `coverage/lcov.info` or `coverage/coverage-summary.json`; `TestSignals` gains `coveragePct?: number`; `buildBasicNote` surfaces coverage in `impactValidation.observed` with a risk warning for files below 50%
- **Multi-language support** — `LanguageAnalyzer` interface + registry; Python (`.py`) and Go (`.go`) analyzers via regex extraction; `parseFile` dispatches by extension; `MULTI_LANGUAGE_INCLUDE` export for opt-in in config
- **MCP server** — `bun src/cli/index.ts mcp` starts a JSON-RPC 2.0 server over stdio; exposes `get_file_note`, `search_by_criticality`, `get_index` tools; compatible with Cursor, Claude Code, and any MCP-capable client
- **Interactive UI** — `bun src/cli/index.ts ui` serves a local web interface at port 7842; browse notes grouped by domain, filter by score, search by filename, view all fields per file

### Fixed
- **Go local import detection** — replaced the incorrect `includes('./')` heuristic with `go.mod`-based module path matching; `getGoModuleName` walks up the directory tree to find the nearest `go.mod` and classifies imports starting with the module prefix as local; falls back to `./`/`../` heuristics when no `go.mod` is found
- **`parseFile` error resilience** — wrapped ts-morph parsing in try/catch in `parseFile`; on any error a warning is logged via `logger.warn` and an empty `StaticFileAnalysis` is returned instead of crashing the pipeline
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
