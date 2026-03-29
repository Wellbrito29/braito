# src/cli/commands/generate.ts

**Criticality:** 0.42 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: runGenerate

| Type | Detail |
|------|--------|
| code | Exported symbols: runGenerate |
| graph | Consumed by: /home/runner/work/braito/braito/src/cli/index.ts |


## Sensitive Dependencies

- node:path
- /home/runner/work/braito/braito/src/cli/index.ts

| Type | Detail |
|------|--------|
| code | import from 'node:path' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/cli/index.ts |

## Important Decisions

- Files whose hash matches the stored note hash reuse their cached StaticFileAnalysis,
- File unchanged and note is current — reuse cached AST analysis
- Skip if the note is already up to date for this file
- 9. Save note cache

| Type | Detail |
|------|--------|
| comment | Files whose hash matches the stored note hash reuse their cached StaticFileAnalysis, |
| comment | File unchanged and note is current — reuse cached AST analysis |
| comment | Skip if the note is already up to date for this file |
| comment | 9. Save note cache |

## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/index.ts, /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts, /home/runner/work/braito/braito/src/core/types/file-analysis.ts, /home/runner/work/braito/braito/src/core/types/project.ts, /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts, /home/runner/work/braito/braito/CHANGELOG.md, /home/runner/work/braito/braito/TODO.md, /home/runner/work/braito/braito/src/cli/commands/scan.ts, /home/runner/work/braito/braito/src/cli/commands/watch.ts, /home/runner/work/braito/braito/src/core/utils/logger.ts

| Type | Detail |
|------|--------|
| git | Co-changed 4x with /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 3x with /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 3x with /home/runner/work/braito/braito/src/core/types/file-analysis.ts |
| git | Co-changed 3x with /home/runner/work/braito/braito/src/core/types/project.ts |
| git | Co-changed 3x with /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 2x with /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/commands/scan.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/utils/logger.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/cli/index.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/src/core/types/file-analysis.ts
- /home/runner/work/braito/braito/src/core/types/project.ts
- /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/cli/commands/scan.ts
- /home/runner/work/braito/braito/src/cli/commands/watch.ts
- /home/runner/work/braito/braito/src/core/utils/logger.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 4x: /home/runner/work/braito/braito/src/cli/index.ts |
| git | Co-changed 3x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 3x: /home/runner/work/braito/braito/src/core/types/file-analysis.ts |
| git | Co-changed 3x: /home/runner/work/braito/braito/src/core/types/project.ts |
| git | Co-changed 3x: /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 2x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/commands/scan.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/commands/watch.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/utils/logger.ts |
