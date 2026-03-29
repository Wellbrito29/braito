# src/cli/commands/watch.ts

**Criticality:** 0.37 | **Generated:** 2026-03-29 | **Model:** static

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



## Impact Validation

- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/tests/graph/buildDependencyGraph.test.ts
- /home/runner/work/braito/braito/.github/workflows/ai-notes.yml
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/cache/cacheStore.ts
- /home/runner/work/braito/braito/src/core/cache/computeHash.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/graph/buildDependencyGraph.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/.github/workflows/ai-notes.yml |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/cacheStore.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/computeHash.ts |
