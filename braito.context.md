# braito — Project Context

<!--
  This file is read by braito and injected into every LLM synthesis prompt.
  Use it to give the model context it cannot infer from code alone.
  Max ~4000 characters. Remove sections that don't apply.
-->

## Domain vocabulary

- **note** — an `AiFileNote`, the primary output artifact (never "document" or "summary")
- **static note** — note built from AST + git analysis only, no LLM
- **synthesis** — LLM enrichment of a static note (adds `inferred[]` fields)
- **consumer** — any file that imports the file being analyzed
- **criticality score** — 0–1 heuristic based on consumers, churn, hooks, tests, env vars

## Architecture constraints

- LLM is called **only at the synthesis edge** — never at the analysis or graph layer
- All LLM providers are swappable via `src/core/llm/provider/factory.ts`
- `observed[]` and `inferred[]` must never be collapsed — this separation is invariant
- `src/cli/` has no business logic — it only orchestrates commands and parses arguments

## Risk areas

- Any change to `src/core/types/ai-note.ts` may require a schema version bump
- `src/core/llm/prompts/systemPrompt.ts` — changes here affect all LLM output quality
- `src/core/output/buildIndex.ts` — `dependents[]` population must match the reverse graph
- `src/cli/commands/ui.ts` — path traversal guard must be preserved on every route change

## Testing notes

- All tests run via `bun test` from the project root
- E2e tests in `tests/e2e/` use real temp directories
- MCP tests use the exported `handleRequest` function directly (no process spawn)
