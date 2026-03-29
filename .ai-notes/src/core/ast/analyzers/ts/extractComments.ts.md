# src/core/ast/analyzers/ts/extractComments.ts

**Criticality:** 0.37 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: extractComments, ExtractedComments

| Type | Detail |
|------|--------|
| code | Exported symbols: extractComments, ExtractedComments |
| graph | Consumed by: /home/runner/work/braito/braito/src/core/ast/parseFile.ts |


## Sensitive Dependencies

- ts-morph
- /home/runner/work/braito/braito/src/core/ast/parseFile.ts

| Type | Detail |
|------|--------|
| code | import from 'ts-morph' |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/ast/parseFile.ts |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/core/config/defaults.ts, /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts, /home/runner/work/braito/braito/src/core/types/file-analysis.ts, /home/runner/work/braito/braito/src/core/types/project.ts, /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts

| Type | Detail |
|------|--------|
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/types/file-analysis.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/types/project.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/core/ast/parseFile.ts
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/config/defaults.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/src/core/types/file-analysis.ts
- /home/runner/work/braito/braito/src/core/types/project.ts
- /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts
- /home/runner/work/braito/braito/src/core/output/buildIndex.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/core/ast/parseFile.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/config/defaults.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/types/file-analysis.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/types/project.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
