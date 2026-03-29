# src/core/cache/cacheStore.ts

**Criticality:** 0.51 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: loadCache, saveCache, HashStore

| Type | Detail |
|------|--------|
| code | Exported symbols: loadCache, saveCache, HashStore |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/cli/commands/watch.ts, /home/runner/work/braito/braito/src/core/cache/isCacheValid.ts |


## Sensitive Dependencies

- node:path
- node:fs/promises
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/src/core/cache/isCacheValid.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| code | import from 'node:fs/promises' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/cache/isCacheValid.ts |



## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/src/core/cache/isCacheValid.ts
- /home/runner/work/braito/braito/.github/workflows/ai-notes.yml
- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/src/core/cache/computeHash.ts
- /home/runner/work/braito/braito/src/core/output/buildIndex.ts
- /home/runner/work/braito/braito/src/core/output/writeIndexNote.ts
- /home/runner/work/braito/braito/tests/cache/cacheStore.test.ts
- /home/runner/work/braito/braito/tests/output/buildIndex.test.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/cache/isCacheValid.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/.github/workflows/ai-notes.yml |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/computeHash.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/isCacheValid.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/writeIndexNote.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/cache/cacheStore.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/tests/output/buildIndex.test.ts |
