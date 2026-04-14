# TODO

Tracked next steps for braito. Move items to CHANGELOG.md when completed.

---

## Short-term

- [ ] **npm publish** — configure `package.json` for public npm release (`name`, `bin`, `files`, `engines`); add `prepublish` build step; test `npx braito` flow end-to-end

- [ ] **SECURITY.md** — document threat model, responsible disclosure policy, and note that config files execute arbitrary code by design; required before public npm release

- [x] **`update` command** — re-run `generate` only for files flagged as stale in `index.json`; avoids full pipeline when only a few notes have aged out

- [x] **LLM analysis improvements** — múltiplas melhorias implementadas: assinaturas completas via ts-morph, conteúdo dos testes, exports dos imports, JSDoc, prompts especializados por tipo de arquivo, instruções ricas por campo, limite de linhas configurável

- [x] **Richer notes for type/interface files** — notes on `.types.ts` and `.dto.ts` files are too shallow (only list exports). Prompt should extract and describe each exported interface's fields, purpose, and constraints. Consider a specialized prompt path for pure type files (no function bodies, only interfaces/enums/types).

- [x] **Absolute paths in Impact Validation** — co-changed files in `impactValidation.observed` still surface as absolute paths in some cases. Trace where `git.coChangedFiles[].path` is set and ensure `path.relative(root, ...)` is applied consistently before building the note.

- [x] **Business rules extraction** — nova tool MCP `get_business_rules(path)` que analisa um arquivo e retorna políticas de domínio identificadas: limites numéricos, guards de permissão, validações de schema, constantes de negócio; combina heurísticas estáticas (constantes `MAX_`/`MIN_`, comparações com literais, `throw` em condicionais) com síntese LLM

---

## Medium-term

- [x] **Graph persistence** — write `.ai-notes/graph.json` with nodes + edges during `generate`; enables graph-based UI without re-computing dependencies at query time

- [x] **Graph UI tab** — interactive D3.js force-directed layout in the `ui` command; nodes by domain/criticality, directed edges, zoom/pan/drag, hover neighbor highlight, click-to-detail, score filter slider

- [x] **`get_impact` transitive depth** — BFS uses `graph.json` for full transitive traversal; falls back to index.dependents

- [x] **Multi-repo MCP** — `mcp --roots "alias=/path,..."` serves multiple repos in a single server; each tool accepts a `repo` argument and `list_repos` enumerates registered repos

- [x] **Semantic search** — BM25 search index via MiniSearch; `generate` builds `.ai-notes/search-index.json`; MCP `search` tool uses ranked full-text search with fuzzy and prefix support

---

## Long-term

- [ ] **rd-autonomous-agents integration** — implement the 8-step guide in `RD_AGENT_TODO.md`; wire braito MCP into Architect and Developer agents as pre-context injection

- [x] **Python/Go language parity** — Python and Go analyzers now extract `exportDetails` with full signatures, docstrings, `__all__` filtering (Python), multiline imports (Python), and exported methods with receivers (Go)

- [ ] **VS Code extension publish** — package and publish `vscode-extension/` to the VS Code Marketplace; add auto-generate on workspace open if `.ai-notes/` is missing

- [ ] **GitHub Action for target repos** — publish a reusable `braito-generate` composite action so any repo can add a one-liner to generate notes on push

- [x] **Governance-aware analysis** — `src/core/governance/` module detects project docs (Docs/, Workflows/, Quality/) and injects `doc` evidence into file notes; `get_governance_context` MCP tool exposes detected governance model

- [x] **Divergence detection** — `src/core/governance/detectDivergence.ts` cross-references governance docs against the codebase and dep graph; detectors for `missing_file`, `undeclared_domain`, `forbidden_dependency`, `undocumented_hotspot`; divergences injected into `knownPitfalls.observed` and persisted to `.ai-notes/divergences.json`; new `get_divergences` MCP tool

- [ ] **Embedding-based semantic search** — optional `@huggingface/transformers` for true semantic search when BM25 is insufficient
