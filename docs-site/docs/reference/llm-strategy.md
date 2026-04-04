---
sidebar_position: 3
---

# LLM Strategy

## Role of the model

The LLM must not be responsible for discovering everything on its own. It receives prepared evidence and synthesizes a reliable, useful note.

## Main rule

**LLM at the edge, not at the center.**

The ideal pipeline is:

- deterministic analysis first
- probabilistic synthesis after

## What to send to the model

For each file:

- file content
- imports and exports
- most relevant reverse dependencies
- git signals
- related tests and coverage
- special comments
- domain context
- criticality score

## What not to do

- send the entire repo
- request inference without evidence
- ask "summarize the file" without context
- mix dozens of files unnecessarily

## Prompt rules

### System prompt

```
You are a software analyst specialized in generating operational notes per file.

Rules:
- Use only the provided evidence.
- Do not invent facts.
- Differentiate observed from inferred.
- Be technical and concise.
- Fill "importantDecisions" only if there are real signals in code, comments, docs, or Git.
- When something is unclear, reduce confidence and leave the field empty or partial.
- Return valid JSON following the requested schema.
```

When `language` is set to a non-English BCP 47 tag (e.g. `pt-BR`, `es`), an additional instruction is appended to the system prompt:

```
- Write all text content (observed, inferred, evidence details) in <language>.
```

This keeps the output language configurable without changing the schema or pipeline.

## Quality rules

1. Evidence required for important claims
2. Numeric confidence always present
3. Fields may be empty
4. `importantDecisions` must be conservative
5. `knownPitfalls` may use churn signals and TODOs
6. `impactValidation` should prioritize real consumers and tests

## Practical recommendations

- use low temperature (0.2)
- use rigid schema (Zod validation)
- discard responses outside the schema
- reprocess only changed files

## Cost strategy

- cache by file hash + signals
- limit synthesis to relevant or critical files (`criticalityScore >= llmThreshold`)
- allow incremental execution

## Confidence guidelines

- 0.90+ when there are clear imports, usage, and tests
- 0.70–0.89 when there is good evidence but some inference
- 0.40–0.69 when it depends on heuristics or partial git signals
- below 0.40 when there is little evidence
