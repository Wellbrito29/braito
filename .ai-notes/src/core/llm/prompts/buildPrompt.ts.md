# src/core/llm/prompts/buildPrompt.ts

**Criticality:** 0.31 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: buildPrompt, PromptContext

| Type | Detail |
|------|--------|
| code | Exported symbols: buildPrompt, PromptContext |
| graph | Consumed by: /home/runner/work/braito/braito/src/core/llm/synthesizeFileNote.ts |


## Sensitive Dependencies

- node:fs
- /home/runner/work/braito/braito/src/core/llm/synthesizeFileNote.ts

| Type | Detail |
|------|--------|
| code | import from 'node:fs' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/llm/synthesizeFileNote.ts |



## Impact Validation

- /home/runner/work/braito/braito/src/core/llm/synthesizeFileNote.ts
- /home/runner/work/braito/braito/ai-notes.config.ts
- /home/runner/work/braito/braito/package.json
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/llm/prompts/systemPrompt.ts
- /home/runner/work/braito/braito/src/core/llm/provider/anthropic.ts
- /home/runner/work/braito/braito/src/core/llm/provider/factory.ts
- /home/runner/work/braito/braito/src/core/llm/provider/ollama.ts
- /home/runner/work/braito/braito/src/core/llm/provider/openai.ts
- /home/runner/work/braito/braito/src/core/llm/provider/types.ts
- /home/runner/work/braito/braito/src/core/llm/schemas/aiNoteSchema.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/core/llm/synthesizeFileNote.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/ai-notes.config.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/package.json |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/prompts/systemPrompt.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/anthropic.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/factory.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/ollama.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/openai.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/types.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/schemas/aiNoteSchema.ts |
