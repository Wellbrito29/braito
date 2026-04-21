---
sidebar_position: 99
---

# Changelog

All notable changes to braito will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Tiered LLM models** — new `llm.highModel` + `llm.highThreshold` (default `0.7`) in `ai-notes.config.ts`; `generate` instantiates a second provider pinned to `highModel` and routes files whose `criticalityScore >= highThreshold` through it while the rest keep using the default `model`; lets teams spend budget on the riskiest files only (e.g. Opus for critical, Sonnet for everything else); end-of-run summary reports how many files used the high-tier model
- **Claude CLI provider** — new `provider: 'claude-cli'` spawns the local `claude` binary (`claude -p --output-format json`) for synthesis; authenticates via the user's existing Claude Code session, skipping `ANTHROPIC_API_KEY`; pipes user prompt via stdin, system prompt via `--system-prompt` (fully replaces default prompt to avoid user memory leakage); surfaces cost and duration metrics; wired into `LLMProviderName`, config schema, and factory
- **Governance divergence detection** — new `src/core/governance/detectDivergence.ts` cross-references governance docs against the actual code and graph; four detectors flag `missing_file`, `undeclared_domain`, `forbidden_dependency` (mined from "`src/X` must not depend on `src/Y`" doc prose), and `undocumented_hotspot` (≥5 reverse deps, no doc coverage); per-file divergences injected into `knownPitfalls.observed` with `evidence.type: 'doc'`; all divergences persisted to `.ai-notes/divergences.json`; new `get_divergences` MCP tool with optional `severity`/`type` filters
- **Multi-repo MCP** — `mcp --roots "alias=/path,..."` registers multiple repositories with one MCP server; tool calls accept a `repo` argument; new `list_repos` tool enumerates registered repos; single-repo behavior via `--root` is unchanged
- **Graph UI — cycles, focus mode, and analysis panel** — `GET /api/graph/cycles` runs iterative Tarjan SCC and returns cycles + flat member set; `GET /api/graph/analysis?path=X` returns per-file graph position (in/out degree, transitive dependents/deps via BFS, neighbor domain distribution, cycle membership, hotspot flag); Graph tab adds Global/Focus toggle with 1–3 hop ego-network, depth slider, domain checkboxes, upstream/downstream/cycle color-coded edges, and a right-side analysis panel; fixed inverted edge direction in the `index.json` fallback graph
- **Python/Go `exportDetails` and `signatures`** — both analyzers now extract rich export metadata: Python extracts function signatures with params/return types, class definitions with bases, and docstrings; Go extracts function signatures including methods with receivers, struct fields, and interface methods; Python respects `__all__` and handles multiline imports; Go captures exported methods with receivers
- **BM25 search index** — `generate` builds `.ai-notes/search-index.json` using MiniSearch; the MCP `search` tool uses BM25 ranked full-text search with fuzzy matching and prefix support; falls back to linear scan when index is absent
- **Graph UI tab** — interactive D3.js force-directed dependency graph visualization in the `ui` command; nodes colored by domain, sized by criticality; directed edges; click-to-detail, zoom/pan/drag, hover neighbor highlight, score filter slider
- **Governance-aware analysis** — new `src/core/governance/` module detects project docs (`Docs/`, `Workflows/`, `Quality/`) and injects `evidence.type: 'doc'` into file notes; new `get_governance_context` MCP tool; `get_architecture_context` enriched with governance summary
- **`get_business_rules` MCP tool** — statically extracts business rules, domain constraints, and policy enforcement patterns from source files
- **Graph persistence** — `generate` writes `.ai-notes/graph.json` with nodes and edges; `get_impact` uses it for full transitive BFS
- **`update` command** — re-runs `generate` only for stale files in `index.json`
- **LLM analysis enrichment** — full type signatures via ts-morph, related test content in prompts, JSDoc extraction, specialized per-file-type prompts
- **Richer notes for type/interface files** — dedicated prompt path for `*.types.ts`, `*.dto.ts`, etc.
- **Live pipeline execution panel** — "▶ Run generate" button triggers the full pipeline from the browser; a bottom log panel shows each step in real time with timestamps and emoji icons; auto-refreshes on completion; `--force` and `--verbose` checkboxes available
- **`--verbose` flag for `generate`** — per-file log with score, dep/consumer counts, churn, signal flags; parse timing per file; top-5 consumers and top-5 by score printed at end; uncovered file count
- **Phase timers** — scan, analyze, graph, and write phases each log elapsed time; graph step logs node + edge count; total run time logged at end
- **Tests tab** — third tab in the file detail pane with coverage status badge, line coverage bar, related test files list, and actionable tip for uncovered files
- **Test coverage stats strip** — global counts (covered / uncovered / avg coverage) above the file list, backed by `/api/stats`
- **`package.json` run scripts** — `bun run scan/generate/generate:force/generate:dry/generate:v/watch/mcp/ui/init:agent` replace verbose `bun src/cli/index.ts …` invocations
- **`debugSignals` in every note** — all raw pipeline signals now stored in each `.json` note, powering the Debug tab score breakdown

### Changed
- **Static-note enrichment v2** — `enrichStaticSignals.ts` merges filename classification (`*.controller.ts`, `*.service.ts`, `*.dto.ts`, `*.use-case.ts`, etc. → human-readable purpose labels), import categorization (DB/HTTP/queue/cache/auth/logging → invariants), and cross-signal inferences ("consumers without tests", "low coverage + N consumers", "volatile file", "side-effectful module") into the observed[] arrays of every note; measured on the 74-file example repo: avg `purpose.observed` 1.0 → 1.9, `knownPitfalls.observed` ~0 → 1.3 per static note
- **Co-change weight self-normalized to churn** — `computeCriticality` now compares `maxCoChange` to the file's own `churnScore`; `+0.15` when the ratio is `≥0.6` with ≥3 co-changes, `+0.10` when the ratio is `≥0.4` with ≥2; heuristic now works on any repo regardless of overall activity level
- **Language-aware decision keywords** — `buildBasicNote` selects decision keywords by `config.language` (English, Portuguese, Spanish, French, German, Italian, with base-language fallback); conventional-commit prefixes `refactor:`, `revert:`, `perf:` match across all languages via regex
- **Expanded side-effect detection** — built-in package list now covers observability (sentry, datadog, newrelic, opentelemetry, …), analytics (mixpanel, amplitude, segment, …), queues (amqp, kafkajs, nats, …), schedulers (bullmq, bull, agenda, …), realtime, caches, and feature flags
- **Configurable analysis hints** — new `analysis.sideEffectPackages` and `analysis.apiCallPatterns` in `ai-notes.config.ts` let teams register internal SDKs without forking; user entries merge with the built-in defaults; validated by the Zod schema
- **`"refactoring"` keyword in decision detection** — commit messages like `"refactoring persistence layer to accept external IDs"` now surface as `importantDecisions` evidence
- **Consolidated co-change evidence in `knownPitfalls`** — per-file `"Co-changed Nx with X"` entries removed from `knownPitfalls.evidence`; a single summary line remains and the detailed list stays in `impactValidation.evidence` only — no more duplication
- **Static-note enrichment** — `buildBasicNote` adds contextual purpose hints (`"Has side effects (module-level execution)"`, `"Makes API calls: …"`) when `purposeObserved` is otherwise sparse; improves static-only notes below `llmThreshold`
- **LLM cost/duration logging** — `generate` logs total cost (USD), LLM time (seconds), and call count at the end of the run
- **Relative paths in notes** — `buildBasicNote` converts absolute paths to relative for portable, readable notes
- **Index uses inferred purpose** — purpose summary column prefers LLM-inferred descriptions when available
- **Dedup observed/inferred** — merge strategy filters LLM `inferred` items that duplicate `observed` items
- **Risky commits kept as evidence only** — no longer promoted to `knownPitfalls.observed`; kept in evidence for LLM reasoning
- **Stronger language directive** — system prompt overrides ambient provider preferences (e.g. Claude CLI user memory)

- **Aggregators now derive from disk (single source of truth)** — `index.json`, `search-index.json`, and `graph.json` node metadata are built from `loadAllNotesFromDisk(root, outputDir)` after the synthesis loop, not from an in-memory `notes[]` populated only by files the loop touched; eliminates the class of bugs where `--filter` / `--force` / cache-only runs accidentally shrank the repo-wide artifacts. Removes three earlier workaround code paths; new helper at `src/core/output/loadAllNotesFromDisk.ts` is a `fs.readdir` walk + parallel `JSON.parse` (~50ms / 74 files) and skips reserved aggregate filenames

- **`purpose.observed`** — now shows full typed function signatures (`name(param: Type): ReturnType`) and first JSDoc line instead of bare export name lists
- **LLM prompt context** — replaced first-200-lines truncation with semantic skeleton extraction: exports + JSDoc + special comments (DECISION/INVARIANT/WHY/HACK), giving the model the most informative content within the same token budget
- **System prompt** — added field-by-field BAD/GOOD examples for all six note fields, preventing the LLM from producing generic export-list summaries
- **Project constitution** (`braito.context.md`) — optional file at project root injected into every LLM synthesis prompt; lets teams define domain vocabulary, architectural constraints, and risk areas that the model uses as context when generating notes
- **Agent slash commands** (`init --agent`) — generates `.claude/commands/braito-note.md`, `braito-impact.md`, `braito-search.md` in the target project so braito tools are available as native slash commands in Claude Code and Cursor
- **Docs site migrated to Docusaurus** — rebuilt with Docusaurus v3, full i18n support (EN + PT-BR), custom homepage, dark mode

---

### Fixed
- **`get_architecture_context` returns empty fields in `topCriticalFiles`** — handler resolved per-file notes from `entry.filePath` (absolute), so `path.resolve` collapsed to the source-file path, every read threw ENOENT, and the silent catch returned `{}`; now uses `entry.relativePath`, adds path-traversal guard, and merges `observed + inferred` so LLM-synthesized purpose/invariants/pitfalls actually surface
- **`--force` wipes cache for files outside `--filter`** — `runGenerate` reset `noteHashStore` and `analysisStore` to empty Maps when `--force` was set; combined with `--filter`, only the matched file got re-cached and every other entry was lost on save, forcing a full LLM re-synthesis on the next run; both stores now load from disk unconditionally and `--force` is enforced inside the loop instead
- **`--filter` rerun shrinks index/search-index/graph to filtered set** — same root cause as the cache-only bug: a `generate --filter` rerun rebuilt the index with just the matched files and dropped every other note's metadata; `runGenerate` now reloads on-disk notes for unfiltered analyses and merges them into `notes[]` before the index/search/graph rebuild
- **`claude-cli` synthesis silently fails when model prepends prose** — responses like `"Looking at this file...\n\n{...}"` or `"Now let me analyze..."` triggered `JSON Parse error` and silently fell back to the static note, losing LLM enrichment for the most critical files; new tolerant parser walks every `{` candidate until one parses, system prompt strengthened with explicit JSON-only directive, regression tests cover prose prefix, suffix, fenced + prose, nested braces, escaped quotes
- **Cache-only `generate` run wipes index/search-index/graph metadata** — when every source file matched the cache, `index.json` and `search-index.json` were rewritten as empty payloads and `graph.json` lost its node metadata; cache-hit branch now reloads the existing per-file note from disk and feeds it into the index build
- **`withDefaults` drops `llm` config** — LLM configuration was silently dropped, causing static-only mode; now passed through correctly
- **LLM evidence schema too strict** — unknown `type` values from the LLM (e.g. `'import'`, `'external'`) are coerced to `'code'` via `.catch('code')` instead of failing Zod validation and silently falling back to the static note
- **Missing `signatures` field in Python/Go analyzers** — LLM prompts no longer show "none extracted" for Python/Go files
- **Absolute paths in Impact Validation** — co-changed files now use relative paths consistently

### Removed
- **`get_overview` MCP tool** — removed orphan tool; `get_architecture_context` provides equivalent and richer functionality

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
