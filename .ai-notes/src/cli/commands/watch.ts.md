# src/cli/commands/watch.ts

**Criticality:** 0.38 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: runWatch

| Type | Detail |
|------|--------|
| code | Exported symbols: runWatch |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/index.ts |


## Sensitive Dependencies

- node:path
- node:fs
- /home/runner/work/braito/braito/src/cli/index.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| code | import from 'node:fs' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/index.ts |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/CHANGELOG.md, /home/runner/work/braito/braito/TODO.md, /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/cli/index.ts

| Type | Detail |
|------|--------|
| git | Co-changed 2x with /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 2x with /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/index.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/README.md
- /home/runner/work/braito/braito/src/cli/commands/scan.ts
- /home/runner/work/braito/braito/src/core/utils/logger.ts
- /home/runner/work/braito/braito/tests/utils/logger.test.ts
- /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 2x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/README.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/scan.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/utils/logger.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/utils/logger.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
