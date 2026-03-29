# src/core/types/file-analysis.ts

**Criticality:** 0.58 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: StaticFileAnalysis, GraphSignals, TestSignals, GitSignals

| Type | Detail |
|------|--------|
| code | Exported symbols: StaticFileAnalysis, GraphSignals, TestSignals, GitSignals |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/core/ast/parseFile.ts, /home/runner/work/braito/braito/src/core/cache/analysisStore.ts |


## Sensitive Dependencies

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/ast/parseFile.ts
- /home/runner/work/braito/braito/src/core/cache/analysisStore.ts
- /home/runner/work/braito/braito/src/core/git/getGitSignals.ts
- /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts

| Type | Detail |
|------|--------|
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/ast/parseFile.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/cache/analysisStore.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/git/getGitSignals.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts, /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts, /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts, /home/runner/work/braito/braito/src/core/config/defaults.ts, /home/runner/work/braito/braito/src/core/types/project.ts

| Type | Detail |
|------|--------|
| git | Co-changed 3x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 3x with /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 3x with /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/types/project.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/ast/parseFile.ts
- /home/runner/work/braito/braito/src/core/cache/analysisStore.ts
- /home/runner/work/braito/braito/src/core/git/getGitSignals.ts
- /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts
- /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts
- /home/runner/work/braito/braito/src/core/types/project.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts
- /home/runner/work/braito/braito/src/core/output/buildIndex.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/ast/parseFile.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/cache/analysisStore.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/git/getGitSignals.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 3x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 3x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 3x: /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/types/project.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
