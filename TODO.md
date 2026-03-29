# TODO

Tracked next steps for braito. Move items to CHANGELOG.md when completed.

---

## Short-term

- [x] **Alias resolution** — `resolveImportPath.ts` reads `tsconfig.paths` but does not handle bundler aliases (Vite, Webpack, Metro). Needed for accurate graphs in monorepos with custom path mappings.

- [x] **Incremental graph rebuild** — full dependency graph is rebuilt on every run even when using cache. In watch mode this is fine, but for large repos a partial rebuild (only affected files + their consumers) would be faster.

- [x] **`--filter` flag** — allow `generate --filter packages/search/**` to scope the pipeline to a subdirectory or domain without changing config.

- [x] **Confidence calibration** — heuristic `criticalityScore` thresholds were set conservatively. After running against real monorepos, tune weights based on observed false positives/negatives.

---

## Medium-term

- [ ] **Heuristic pre-fill for `invariants` and `importantDecisions`** — these fields are currently only filled by LLM. A pattern matching pass (comments, ADR files, changelog) would improve coverage even without LLM.

- [ ] **Domain grouping in `index.md`** — group files by folder/package instead of a flat ranked list. Useful for monorepos where each package has its own criticality context.

- [ ] **Stale note detection** — flag notes whose `generatedAt` is older than N days or whose source file has changed since last synthesis, prompting re-synthesis.

- [ ] **Test coverage hints** — integrate with coverage reports (lcov, c8) to surface actual uncovered files in `impactValidation`, not just heuristic test discovery.

---

## Long-term / Phase 5

- [ ] **Multi-language support** — AST layer is modular per language (`core/ast/analyzers/`). Adding Python (via tree-sitter) or Go follows the same extractor pattern.

- [ ] **MCP server** — expose braito as a Model Context Protocol server so AI assistants (Cursor, Claude) can query notes about specific files on demand during code review.

- [ ] **Interactive UI** — `bun src/cli/index.ts ui` command serving a local web interface to browse the index, filter by domain/score, and trigger re-synthesis.
