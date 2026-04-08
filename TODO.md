# TODO

Tracked next steps for braito. Move items to CHANGELOG.md when completed.

---

## Short-term

- [x] **Graph persistence** — serializar o grafo de dependências para `.ai-notes/graph.json` (nodes + edges) ao final do `generate`; transforma o grafo de artefato temporário em artefato de primeira classe

- [x] **`get_impact` transitive depth** — usar `graph.json` para BFS completo no grafo de dependências em vez de ler apenas `dependents[]` do index; expõe impacto transitivo real (A → B → C)

- [x] **`update` command** — re-run `generate` only for files flagged as stale in `index.json`; avoids full pipeline when only a few notes have aged out

- [x] **LLM analysis improvements** — múltiplas melhorias implementadas: assinaturas completas via ts-morph, conteúdo dos testes, exports dos imports, JSDoc, prompts especializados por tipo de arquivo, instruções ricas por campo, limite de linhas configurável

- [ ] **Richer notes for type/interface files** — notes on `.types.ts` and `.dto.ts` files are too shallow (only list exports). Prompt should extract and describe each exported interface's fields, purpose, and constraints. Consider a specialized prompt path for pure type files (no function bodies, only interfaces/enums/types).

- [ ] **Absolute paths in Impact Validation** — co-changed files in `impactValidation.observed` still surface as absolute paths in some cases. Trace where `git.coChangedFiles[].path` is set and ensure `path.relative(root, ...)` is applied consistently before building the note.

- [ ] **Business rules extraction** — nova tool MCP `get_business_rules(path)` que analisa um arquivo e retorna políticas de domínio identificadas: limites numéricos, guards de permissão, validações de schema, constantes de negócio; combina heurísticas estáticas (constantes `MAX_`/`MIN_`, comparações com literais, `throw` em condicionais) com síntese LLM

---

## Medium-term

- [ ] **Graph UI tab** — add a "Graph" view to the `ui` command using D3.js force-directed layout; nodes colored by domain/criticality, edges from dependency graph, click-to-detail; depende do graph.json persistido

- [ ] **Multi-repo MCP** — allow a single MCP server instance to serve notes for multiple roots via a `--roots` flag or registry file; mirrors GitNexus multi-repo model

- [ ] **Semantic search** — index `purpose.inferred` and `knownPitfalls.inferred` fields with BM25 or local embeddings (transformers.js); expose via upgraded `search` MCP tool

---

## Long-term

- [ ] **rd-autonomous-agents integration** — implement the 8-step guide in `RD_AGENT_TODO.md`; wire braito MCP into Architect and Developer agents as pre-context injection

- [ ] **Python/Go language parity** — bring Python and Go analyzers to feature parity with the TypeScript analyzer (hooks detection, env var extraction, comment pattern matching)

- [ ] **VS Code extension publish** — package and publish `vscode-extension/` to the VS Code Marketplace; add auto-generate on workspace open if `.ai-notes/` is missing

- [ ] **GitHub Action for target repos** — publish a reusable `braito-generate` composite action so any repo can add a one-liner to generate notes on push
