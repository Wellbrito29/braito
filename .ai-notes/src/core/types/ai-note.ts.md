# src/core/types/ai-note.ts

**Criticality:** 0.51 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: EvidenceItem, StructuredListField, AiFileNote

| Type | Detail |
|------|--------|
| code | Exported symbols: EvidenceItem, StructuredListField, AiFileNote |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/cli/commands/watch.ts, /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts |


## Sensitive Dependencies

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts
- /home/runner/work/braito/braito/src/core/llm/synthesizeFileNote.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts

| Type | Detail |
|------|--------|
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/llm/synthesizeFileNote.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |



## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts
- /home/runner/work/braito/braito/src/core/llm/synthesizeFileNote.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/src/core/output/buildIndex.ts
- /home/runner/work/braito/braito/src/core/output/writeJsonNote.ts
- /home/runner/work/braito/braito/src/core/output/writeMarkdownNote.ts
- /home/runner/work/braito/braito/CLAUDE.md
- /home/runner/work/braito/braito/ai-notes.config.ts
- /home/runner/work/braito/braito/package.json
- /home/runner/work/braito/braito/src/cli/commands/scan.ts
- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractExports.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractHooks.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractImports.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/llm/synthesizeFileNote.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/output/writeJsonNote.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/output/writeMarkdownNote.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CLAUDE.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/ai-notes.config.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/package.json |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/scan.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractExports.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractHooks.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractImports.ts |
