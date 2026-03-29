# src/core/types/project.ts

**Criticality:** 0.52 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: DiscoveredFile, LLMProviderName, LLMConfig, AiNotesConfig

| Type | Detail |
|------|--------|
| code | Exported symbols: DiscoveredFile, LLMProviderName, LLMConfig, AiNotesConfig |
| graph | Consumed by: /home/runner/work/braito/braito/ai-notes.config.ts, /home/runner/work/braito/braito/src/core/config/defaults.ts, /home/runner/work/braito/braito/src/core/config/loadConfig.ts |


## Sensitive Dependencies

- /home/runner/work/braito/braito/ai-notes.config.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts
- /home/runner/work/braito/braito/src/core/config/loadConfig.ts
- /home/runner/work/braito/braito/src/core/llm/provider/factory.ts
- /home/runner/work/braito/braito/src/core/scanner/discoverFiles.ts

| Type | Detail |
|------|--------|
| graph | Reverse dep: /home/runner/work/braito/braito/ai-notes.config.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/config/loadConfig.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/llm/provider/factory.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/scanner/discoverFiles.ts |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/ai-notes.config.ts, /home/runner/work/braito/braito/package.json, /home/runner/work/braito/braito/src/cli/commands/generate.ts

| Type | Detail |
|------|--------|
| git | Co-changed 2x with /home/runner/work/braito/braito/ai-notes.config.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/package.json |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |

## Impact Validation

- /home/runner/work/braito/braito/ai-notes.config.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts
- /home/runner/work/braito/braito/src/core/config/loadConfig.ts
- /home/runner/work/braito/braito/src/core/llm/provider/factory.ts
- /home/runner/work/braito/braito/src/core/scanner/discoverFiles.ts
- /home/runner/work/braito/braito/src/core/scanner/scanRepository.ts
- /home/runner/work/braito/braito/src/core/tests/findRelatedTests.ts
- /home/runner/work/braito/braito/package.json
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts
- /home/runner/work/braito/braito/src/core/llm/prompts/systemPrompt.ts
- /home/runner/work/braito/braito/src/core/llm/provider/anthropic.ts
- /home/runner/work/braito/braito/src/core/llm/provider/ollama.ts
- /home/runner/work/braito/braito/src/core/llm/provider/openai.ts
- /home/runner/work/braito/braito/src/core/llm/provider/types.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/ai-notes.config.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/config/loadConfig.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/llm/provider/factory.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/scanner/discoverFiles.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/scanner/scanRepository.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/tests/findRelatedTests.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/ai-notes.config.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/package.json |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/prompts/systemPrompt.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/anthropic.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/factory.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/ollama.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/openai.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/llm/provider/types.ts |
