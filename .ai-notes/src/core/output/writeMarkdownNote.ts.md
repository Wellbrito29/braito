# src/core/output/writeMarkdownNote.ts

**Criticality:** 0.41 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: writeMarkdownNote

| Type | Detail |
|------|--------|
| code | Exported symbols: writeMarkdownNote |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/cli/commands/watch.ts |


## Sensitive Dependencies

- node:path
- node:fs/promises
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| code | import from 'node:fs/promises' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/watch.ts |



## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/ai-notes.config.ts
- /home/runner/work/braito/braito/package.json
- /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts
- /home/runner/work/braito/braito/src/core/llm/prompts/systemPrompt.ts
- /home/runner/work/braito/braito/src/core/llm/provider/anthropic.ts
- /home/runner/work/braito/braito/src/core/llm/provider/factory.ts
- /home/runner/work/braito/braito/src/core/llm/provider/ollama.ts
- /home/runner/work/braito/braito/src/core/llm/provider/openai.ts
- /home/runner/work/braito/braito/src/core/llm/provider/types.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/ai-notes.config.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/package.json |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/prompts/systemPrompt.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/anthropic.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/factory.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/ollama.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/openai.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/types.ts |
