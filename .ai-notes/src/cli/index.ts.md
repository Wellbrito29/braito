# src/cli/index.ts

**Criticality:** 0.23 | **Generated:** 2026-03-29 | **Model:** static



## Sensitive Dependencies

- node:util

| Type | Detail |
|------|--------|
| code | import from 'node:util' |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/commands/generate.ts

| Type | Detail |
|------|--------|
| git | Co-changed 3x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/cache/analysisStore.ts
- /home/runner/work/braito/braito/src/core/graph/loadBundlerAliases.ts
- /home/runner/work/braito/braito/.github/workflows/ai-notes.yml
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/src/core/cache/cacheStore.ts
- /home/runner/work/braito/braito/src/core/cache/computeHash.ts
- /home/runner/work/braito/braito/src/core/cache/isCacheValid.ts
- /home/runner/work/braito/braito/src/core/output/buildIndex.ts
- /home/runner/work/braito/braito/src/core/output/writeIndexNote.ts

| Type | Detail |
|------|--------|
| git | Co-changed 3x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/analysisStore.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/graph/loadBundlerAliases.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/.github/workflows/ai-notes.yml |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/cacheStore.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/computeHash.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/isCacheValid.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/writeIndexNote.ts |
