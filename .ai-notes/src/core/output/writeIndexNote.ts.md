# src/core/output/writeIndexNote.ts

**Criticality:** 0.47 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: writeIndexNote

| Type | Detail |
|------|--------|
| code | Exported symbols: writeIndexNote |
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


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/core/output/buildIndex.ts, /home/runner/work/braito/braito/tests/output/buildIndex.test.ts

| Type | Detail |
|------|--------|
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/tests/output/buildIndex.test.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/src/core/output/buildIndex.ts
- /home/runner/work/braito/braito/tests/output/buildIndex.test.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts
- /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/src/core/tests/loadCoverage.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/tests/output/buildIndex.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/tests/loadCoverage.ts |
