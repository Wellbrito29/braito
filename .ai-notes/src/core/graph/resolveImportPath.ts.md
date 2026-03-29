# src/core/graph/resolveImportPath.ts

**Criticality:** 0.31 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: resolveImportPath

| Type | Detail |
|------|--------|
| code | Exported symbols: resolveImportPath |
| graph | Consumed by: /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |


## Sensitive Dependencies

- node:path
- node:fs
- /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| code | import from 'node:fs' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |



## Impact Validation

- /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts
- /home/runner/work/braito/braito/CLAUDE.md
- /home/runner/work/braito/braito/ai-notes.config.ts
- /home/runner/work/braito/braito/package.json
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/scan.ts
- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractExports.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractHooks.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractImports.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/core/graph/buildDependencyGraph.ts |
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
