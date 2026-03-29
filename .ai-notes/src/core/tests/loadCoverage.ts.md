# src/core/tests/loadCoverage.ts

**Criticality:** 0.36 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: loadCoverage

| Type | Detail |
|------|--------|
| code | Exported symbols: loadCoverage |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/commands/generate.ts |


## Sensitive Dependencies

- node:path
- node:fs
- /home/runner/work/braito/braito/src/cli/commands/generate.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| code | import from 'node:fs' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/generate.ts |



## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts
- /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/src/core/output/buildIndex.ts
- /home/runner/work/braito/braito/src/core/output/writeIndexNote.ts
- /home/runner/work/braito/braito/src/core/tests/parseLcov.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/writeIndexNote.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/tests/parseLcov.ts |
