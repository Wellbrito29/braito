# src/core/config/loadConfig.ts

**Criticality:** 0.51 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: loadConfig

| Type | Detail |
|------|--------|
| code | Exported symbols: loadConfig |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/cli/commands/scan.ts, /home/runner/work/braito/braito/src/cli/commands/watch.ts |


## Sensitive Dependencies

- node:path
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/scan.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/scan.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/watch.ts |



## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/scan.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/CLAUDE.md
- /home/runner/work/braito/braito/ai-notes.config.ts
- /home/runner/work/braito/braito/package.json
- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractExports.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractHooks.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractImports.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/scan.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CLAUDE.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/ai-notes.config.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/package.json |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/scan.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractExports.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractHooks.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractImports.ts |
