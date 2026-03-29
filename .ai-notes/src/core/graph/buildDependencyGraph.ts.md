# src/core/graph/buildDependencyGraph.ts

**Criticality:** 0.37 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: buildDependencyGraph, updateDependencyGraph

| Type | Detail |
|------|--------|
| code | Exported symbols: buildDependencyGraph, updateDependencyGraph |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/cli/commands/watch.ts |


## Sensitive Dependencies

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts

| Type | Detail |
|------|--------|
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/commands/watch.ts |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts, /home/runner/work/braito/braito/tests/graph/buildDependencyGraph.test.ts

| Type | Detail |
|------|--------|
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/tests/graph/buildDependencyGraph.test.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/tests/graph/buildDependencyGraph.test.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/CLAUDE.md
- /home/runner/work/braito/braito/ai-notes.config.ts
- /home/runner/work/braito/braito/package.json
- /home/runner/work/braito/braito/src/cli/commands/scan.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/tests/graph/buildDependencyGraph.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CLAUDE.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/ai-notes.config.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/package.json |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/cli/commands/scan.ts |
