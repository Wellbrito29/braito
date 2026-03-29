# src/core/graph/loadBundlerAliases.ts

**Criticality:** 0.31 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: loadBundlerAliases, PathAliases

| Type | Detail |
|------|--------|
| code | Exported symbols: loadBundlerAliases, PathAliases |
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
- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/src/core/cache/analysisStore.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/analysisStore.ts |
