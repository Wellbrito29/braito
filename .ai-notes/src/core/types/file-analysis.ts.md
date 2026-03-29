# src/core/types/file-analysis.ts

**Criticality:** 0.52 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: StaticFileAnalysis, GraphSignals, TestSignals, GitSignals

| Type | Detail |
|------|--------|
| code | Exported symbols: StaticFileAnalysis, GraphSignals, TestSignals, GitSignals |
| graph | Consumed by: /home/runner/work/braito/braito/src/core/ast/parseFile.ts, /home/runner/work/braito/braito/src/core/git/getGitSignals.ts, /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |


## Sensitive Dependencies

- /home/runner/work/braito/braito/src/core/ast/parseFile.ts
- /home/runner/work/braito/braito/src/core/git/getGitSignals.ts
- /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts
- /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts

| Type | Detail |
|------|--------|
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/ast/parseFile.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/git/getGitSignals.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts, /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts

| Type | Detail |
|------|--------|
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/core/ast/parseFile.ts
- /home/runner/work/braito/braito/src/core/git/getGitSignals.ts
- /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts
- /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts
- /home/runner/work/braito/braito/src/core/git/getCoChangedFiles.ts
- /home/runner/work/braito/braito/src/core/git/getFileHistory.ts
- /home/runner/work/braito/braito/tests/git/getCoChangedFiles.test.ts
- /home/runner/work/braito/braito/tests/git/getFileHistory.test.ts
- /home/runner/work/braito/braito/tests/git/getGitSignals.test.ts
- /home/runner/work/braito/braito/CLAUDE.md

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/core/ast/parseFile.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/git/getGitSignals.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/llm/prompts/buildPrompt.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/git/getCoChangedFiles.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/git/getFileHistory.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/git/getGitSignals.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/git/getCoChangedFiles.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/git/getFileHistory.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/git/getGitSignals.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CLAUDE.md |
