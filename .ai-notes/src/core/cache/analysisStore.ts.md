# src/core/cache/analysisStore.ts

**Criticality:** 0.31 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: loadAnalysisStore, saveAnalysisStore, AnalysisStore

| Type | Detail |
|------|--------|
| code | Exported symbols: loadAnalysisStore, saveAnalysisStore, AnalysisStore |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/commands/generate.ts |


## Sensitive Dependencies

- node:path
- node:fs/promises
- /home/runner/work/braito/braito/src/cli/commands/generate.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| code | import from 'node:fs/promises' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/generate.ts |



## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/src/core/graph/loadBundlerAliases.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/graph/loadBundlerAliases.ts |
