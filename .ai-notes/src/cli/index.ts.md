# src/cli/index.ts

**Criticality:** 0.19 | **Generated:** 2026-03-29 | **Model:** static



## Sensitive Dependencies

- node:util

| Type | Detail |
|------|--------|
| code | import from 'node:util' |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/core/ast/parseFile.ts, /home/runner/work/braito/braito/src/core/config/defaults.ts

| Type | Detail |
|------|--------|
| git | Co-changed 3x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/ast/parseFile.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/config/defaults.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/ast/parseFile.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/cli/commands/mcp.ts
- /home/runner/work/braito/braito/src/cli/commands/ui.ts
- /home/runner/work/braito/braito/src/core/ast/analyzerRegistry.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/go/goAnalyzer.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/python/pythonAnalyzer.ts

| Type | Detail |
|------|--------|
| git | Co-changed 3x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/ast/parseFile.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/mcp.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/ui.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzerRegistry.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/go/goAnalyzer.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/ast/analyzers/python/pythonAnalyzer.ts |
