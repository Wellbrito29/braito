# src/cli/commands/ui.ts

**Criticality:** 0.46 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: runUi

| Type | Detail |
|------|--------|
| code | Exported symbols: runUi |
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
- /home/runner/work/braito/braito/src/cli/commands/mcp.ts
- /home/runner/work/braito/braito/src/core/ast/analyzerRegistry.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/go/goAnalyzer.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/python/pythonAnalyzer.ts
- /home/runner/work/braito/braito/src/core/ast/parseFile.ts
- /home/runner/work/braito/braito/src/core/ast/types.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/mcp.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzerRegistry.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/go/goAnalyzer.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/python/pythonAnalyzer.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/parseFile.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/types.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/config/defaults.ts |
