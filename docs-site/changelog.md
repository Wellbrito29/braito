# Changelog

All notable changes to braito will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Agent slash commands** (`init --agent` command) — generates native command files for AI coding assistants (`.claude/commands/`, `.cursor/commands/`, etc.) so braito tools are available without manual MCP setup

### Changed
- **`purpose.observed`** — now shows full typed function signatures (`name(param: Type): ReturnType`) and first JSDoc line instead of bare export name lists
- **LLM prompt context** — replaced first-200-lines truncation with semantic skeleton extraction: exports + JSDoc + special comments (DECISION/INVARIANT/WHY/HACK), giving the model the most informative content within the same token budget
- **System prompt** — added field-by-field BAD/GOOD examples for all six note fields, preventing the LLM from producing generic export-list summaries
- **Project constitution** (`braito.context.md`) — optional file at project root injected into every LLM synthesis prompt; lets teams define domain vocabulary, architectural constraints, and risk areas that the model uses as context when generating notes
- **Docs site i18n** — full Portuguese (pt-BR) translation of all 11 documentation pages with language switcher in the top nav
- **Docs site changelog** — dedicated changelog page tracking all notable changes

---

## [0.6.0] — 2026-04-04

### Added
- **Per-file changelog** (`recentChanges[]`) — every note now includes the last 10 commits for the file (hash, ISO date, message, author); rendered as `## Recent Changes` in `.md` sidecars and visible in the UI Debug tab
- **Debug tab in Web UI** — second tab in the file detail pane showing: criticality score breakdown bars, full evidence trail with type badges (`code`, `git`, `test`, `graph`, `comment`, `doc`), and per-file changelog
- **Multi-language LLM output** — `language` config field (BCP 47) and `--language / -l` CLI flag; LLM-synthesized content is generated in the configured language; priority: `--language` flag > config file > default (`en`)
- **`get_impact` MCP tool** — BFS traversal of `dependents[]` returning blast-radius analysis: total affected files + per-level breakdown with criticality and domain
- **`search` MCP tool** — full-text search across all `observed[]`, `inferred[]`, and `evidence[].detail` arrays in every note
- **`get_domain` MCP tool** — all files in a given domain sorted by criticality, with file count and average score
- **`dependents[]` in IndexEntry** — reverse dependency list persisted in each index entry, populated from the reverse graph during generation

### Fixed
- **Path traversal in UI** — `/api/note` now validates the resolved path starts within `notesDir` before serving
- **Path traversal in MCP** — `get_file_note` validates the resolved path before reading the note file
- **`apiKey` removed from config schema** — API keys can no longer be stored in `ai-notes.config.ts`; env-var-only enforcement across all providers
- **Output path escape guard** — `writeJsonNote` validates the output path stays within the notes directory

---

## [0.5.0] — 2026-03-29

### Added
- **VS Code extension** — file decorations (`⚡` high-criticality, `⚠` stale), hover provider on imports, `braito: Show Note for Current File` command
- **`generate --dry-run`** — full pipeline run without writing files; prints per-file summary
- **CLI e2e tests** — 22 integration tests covering `scan`, `generate`, and `mcp`
- **`get_architecture_context` MCP tool** — synthesized architectural overview: top critical files, domain breakdown, invariants
- **`mcp --auto-generate`** — generates notes if missing before accepting MCP requests
- **Progress indicator** — in-place TTY progress bar for analysis and note-writing phases
- **LLM synthesis timeout** — `timeoutMs` parameter (default 30 000 ms) with automatic fallback to static note
- **Config validation** — Zod schema validation for `ai-notes.config.ts` with clear field-path errors
- **Logger upgrade** — structured `Logger` class with `debug`/`info`/`warn`/`error`/`silent` levels; `--debug`, `--verbose`, `--silent` flags
- **`scan --format json|table`** — machine-readable JSON output for piping
- **Dynamic import detection** — `import('./path')` calls detected and included in dependency graph
- **Schema versioning** — `schemaVersion: '1.0.0'` in `AiFileNote` and `NoteIndex`
- **LLM retry with exponential backoff** — max 3 retries, base 1 s, doubling per attempt
- **Cycle detection** — DFS cycle detection; flagged in `knownPitfalls.observed`
- **Concurrent file processing** — parallel LLM synthesis capped at `concurrency` (default 5)
- **`generate --diff`** — field-level diff report before overwriting existing notes
- **`generate --filter <glob>`** — scope generation to a subdirectory
- **Test coverage hints** — `coveragePct` from `lcov.info` / `coverage-summary.json` surfaced in `impactValidation`
- **Multi-language source support** — Python (`.py`) and Go (`.go`) analyzers via opt-in `MULTI_LANGUAGE_INCLUDE`
- **MCP server** — JSON-RPC 2.0 over stdio with `get_file_note`, `search_by_criticality`, `get_index`
- **Web UI** — local SPA at port 7842 with domain grouping, score filter, and field rendering

### Fixed
- Go local import detection via `go.mod` module path matching
- `parseFile` error resilience — returns empty analysis instead of crashing
- Alias resolution in watch mode
- Incremental graph rebuild in watch mode

---

## [1.0.0] — 2026-03-29

### Added
- Scanner, static analyzer (AST), graph engine, git intelligence, cache, LLM layer, output publisher
- CLI commands: `scan`, `generate` (with `--force`), `watch`
- GitHub Actions CI workflow
- Domain model: `AiFileNote` with `observed`/`inferred` split
- Full test suite via `bun test`
