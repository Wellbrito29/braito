# src/core/types/project.ts

**Criticality:** 0.58 | **Generated:** 2026-03-29 | **Model:** static

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

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts, /home/runner/work/braito/braito/src/core/config/defaults.ts, /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts, /home/runner/work/braito/braito/src/core/types/file-analysis.ts, /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts, /home/runner/work/braito/braito/ai-notes.config.ts, /home/runner/work/braito/braito/package.json

| Type | Detail |
|------|--------|
| git | Co-changed 3x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/types/file-analysis.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/ai-notes.config.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/package.json |

## Impact Validation

- /home/runner/work/braito/braito/ai-notes.config.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts
- /home/runner/work/braito/braito/src/core/config/loadConfig.ts
- /home/runner/work/braito/braito/src/core/llm/provider/factory.ts
- /home/runner/work/braito/braito/src/core/scanner/discoverFiles.ts
- /home/runner/work/braito/braito/src/core/scanner/scanRepository.ts
- /home/runner/work/braito/braito/src/core/tests/findRelatedTests.ts
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/src/core/types/file-analysis.ts
- /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts
- /home/runner/work/braito/braito/package.json
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/ai-notes.config.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/config/loadConfig.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/llm/provider/factory.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/scanner/discoverFiles.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/scanner/scanRepository.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/tests/findRelatedTests.ts |
| git | Co-changed 3x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/types/file-analysis.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/ai-notes.config.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/package.json |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
