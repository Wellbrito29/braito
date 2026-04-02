# TODO

Tracked next steps for braito. Move items to CHANGELOG.md when completed.

---

## Short-term

- [ ] **Richer notes for type/interface files** — notes on `.types.ts` and `.dto.ts` files are too shallow (only list exports). Prompt should extract and describe each exported interface's fields, purpose, and constraints. Consider a specialized prompt path for pure type files (no function bodies, only interfaces/enums/types).

- [ ] **Absolute paths in Impact Validation** — co-changed files in `impactValidation.observed` still surface as absolute paths in some cases. Trace where `git.coChangedFiles[].path` is set and ensure `path.relative(root, ...)` is applied consistently before building the note.

- [ ] **npm publish** — configure `package.json` for public npm release (`name`, `bin`, `files`, `engines`); add `prepublish` build step; test `npx braito` flow end-to-end

- [ ] **SECURITY.md** — document threat model, responsible disclosure policy, and note that config files execute arbitrary code by design; required before public npm release

- [ ] **`update` command** — re-run `generate` only for files flagged as stale in `index.json`; avoids full pipeline when only a few notes have aged out

---

## Medium-term

- [ ] **Graph persistence** — write `.ai-notes/graph.json` with nodes + edges during `generate`; enables graph-based UI without re-computing dependencies at query time

- [ ] **Graph UI tab** — add a "Graph" view to the `ui` command using D3.js force-directed layout; nodes colored by domain/criticality, edges from dependency graph, click-to-detail

- [ ] **`get_impact` transitive depth** — currently BFS reads `dependents[]` from index; for deeper accuracy, fall back to `graph.json` when available

- [ ] **Multi-repo MCP** — allow a single MCP server instance to serve notes for multiple roots via a `--roots` flag or registry file; mirrors GitNexus multi-repo model

- [ ] **Semantic search** — index `purpose.inferred` and `knownPitfalls.inferred` fields with BM25 or local embeddings (transformers.js); expose via upgraded `search` MCP tool

---

## Long-term

- [ ] **rd-autonomous-agents integration** — implement the 8-step guide in `RD_AGENT_TODO.md`; wire braito MCP into Architect and Developer agents as pre-context injection

- [ ] **Python/Go language parity** — bring Python and Go analyzers to feature parity with the TypeScript analyzer (hooks detection, env var extraction, comment pattern matching)

- [ ] **VS Code extension publish** — package and publish `vscode-extension/` to the VS Code Marketplace; add auto-generate on workspace open if `.ai-notes/` is missing

- [ ] **GitHub Action for target repos** — publish a reusable `braito-generate` composite action so any repo can add a one-liner to generate notes on push
