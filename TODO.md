# TODO

Tracked next steps for braito. Move items to CHANGELOG.md when completed.

---

## Short-term

- [x] **Alias resolution** — `resolveImportPath.ts` reads `tsconfig.paths` but does not handle bundler aliases (Vite, Webpack, Metro). Needed for accurate graphs in monorepos with custom path mappings.

- [x] **Incremental graph rebuild** — full dependency graph is rebuilt on every run even when using cache. In watch mode this is fine, but for large repos a partial rebuild (only affected files + their consumers) would be faster.

- [x] **`--filter` flag** — allow `generate --filter packages/search/**` to scope the pipeline to a subdirectory or domain without changing config.

- [x] **Confidence calibration** — heuristic `criticalityScore` thresholds were set conservatively. After running against real monorepos, tune weights based on observed false positives/negatives.

- [x] **Logger upgrade** ⭐ — replace the current simple logger with a structured logger supporting log levels (`debug`, `info`, `warn`, `error`), optional timestamps, and a `--debug` / `--verbose` CLI flag; improves diagnosability across all commands.

- [x] **Temperature bug fix** — `provider/anthropic.ts` and `provider/openai.ts` ignore the user's `temperature` config; fix both providers to respect `llmConfig.temperature`.

- [x] **Config validation** — validate `ai-notes.config.ts` with Zod on load; emit clear errors for unknown keys or invalid values instead of silently falling back to defaults.

- [x] **LLM synthesis timeout** — add a configurable per-file timeout (default 30s) to `synthesizeFileNote`; fall back to static note on timeout instead of hanging indefinitely.

- [ ] **Dynamic import detection** — `extractImports.ts` misses `import('./path')` — add regex-based detection so lazy-loaded dependencies appear in the graph.

- [x] **Go local import detection fix** — the current heuristic (`includes('./')`) is incorrect for Go; use module-relative path matching based on the package declaration or `go.mod`.

---

## Medium-term

- [x] **Heuristic pre-fill for `invariants` and `importantDecisions`** — these fields are currently only filled by LLM. A pattern matching pass (comments, ADR files, changelog) would improve coverage even without LLM.

- [x] **Domain grouping in `index.md`** — group files by folder/package instead of a flat ranked list. Useful for monorepos where each package has its own criticality context.

- [x] **Stale note detection** — flag notes whose `generatedAt` is older than N days or whose source file has changed since last synthesis, prompting re-synthesis.

- [x] **Test coverage hints** — integrate with coverage reports (lcov, c8) to surface actual uncovered files in `impactValidation`, not just heuristic test discovery.

- [ ] **LLM retry with backoff** — add exponential backoff (max 3 retries) for transient LLM errors (network timeout, 429 rate limit) in all providers; distinguish transient from permanent failures.

- [ ] **Concurrent file processing** — process files in parallel batches in `generate`; respect LLM rate limits with a concurrency cap (e.g. 5 simultaneous synthesis calls).

- [ ] **Cycle detection in dependency graph** — detect and warn about circular imports during graph construction; flag involved files in their notes.

- [ ] **CLI e2e tests** — integration tests for `generate`, `watch`, `mcp`, and `ui` commands using real temp fixtures; currently only unit tests exist.

- [ ] **`scan --format json`** — add `--format json|table` flag to the `scan` command for machine-readable output and integration with external tools.

- [x] **`parseFile` error resilience** — wrap ts-morph parsing in try/catch; emit a warning and return an empty analysis instead of crashing on files with syntax errors.

---

## Long-term / Phase 5

- [x] **Multi-language support** — AST layer is modular per language (`core/ast/analyzers/`). Adding Python (via tree-sitter) or Go follows the same extractor pattern.

- [x] **MCP server** — expose braito as a Model Context Protocol server so AI assistants (Cursor, Claude) can query notes about specific files on demand during code review.

- [x] **Interactive UI** — `bun src/cli/index.ts ui` command serving a local web interface to browse the index, filter by domain/score, and trigger re-synthesis.

- [ ] **Schema versioning** — add `schemaVersion` field to `AiFileNote` and `NoteIndex`; enables safe migration when the schema evolves without breaking old notes.

- [ ] **Diff mode** — `generate --diff` compares old vs. new notes and shows what changed per field; useful for PR review workflows.

- [ ] **VS Code extension** — native extension that surfaces criticality scores in the file explorer, shows inline note summaries on hover, and integrates with the MCP server.
