# src/core/git/getCoChangedFiles.ts

**Criticality:** 0.31 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: getCoChangedFiles, CoChangedFile

| Type | Detail |
|------|--------|
| code | Exported symbols: getCoChangedFiles, CoChangedFile |
| graph | Consumed by: /home/runner/work/braito/braito/src/core/git/getGitSignals.ts |


## Sensitive Dependencies

- node:path
- /home/runner/work/braito/braito/src/core/git/getGitSignals.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/git/getGitSignals.ts |



## Impact Validation

- /home/runner/work/braito/braito/src/core/git/getGitSignals.ts
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/git/getFileHistory.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/src/core/types/file-analysis.ts
- /home/runner/work/braito/braito/tests/git/getCoChangedFiles.test.ts
- /home/runner/work/braito/braito/tests/git/getFileHistory.test.ts
- /home/runner/work/braito/braito/tests/git/getGitSignals.test.ts
- /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/core/git/getGitSignals.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/git/getFileHistory.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/git/getGitSignals.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/types/file-analysis.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/git/getCoChangedFiles.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/git/getFileHistory.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/git/getGitSignals.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
