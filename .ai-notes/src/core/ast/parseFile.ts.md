# src/core/ast/parseFile.ts

**Criticality:** 0.47 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: parseFile

| Type | Detail |
|------|--------|
| code | Exported symbols: parseFile |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/cli/commands/watch.ts |


## Sensitive Dependencies

- node:path
- node:fs
- ts-morph
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| code | import from 'node:fs' |
| code | import from 'ts-morph' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/watch.ts |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/index.ts, /home/runner/work/braito/braito/src/core/config/defaults.ts

| Type | Detail |
|------|--------|
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/config/defaults.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/cli/commands/mcp.ts
- /home/runner/work/braito/braito/src/cli/commands/ui.ts
- /home/runner/work/braito/braito/src/core/ast/analyzerRegistry.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/go/goAnalyzer.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/python/pythonAnalyzer.ts
- /home/runner/work/braito/braito/src/core/ast/types.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/mcp.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/ui.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzerRegistry.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/go/goAnalyzer.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/python/pythonAnalyzer.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/types.ts |
