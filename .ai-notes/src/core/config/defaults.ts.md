# src/core/config/defaults.ts

**Criticality:** 0.37 | **Generated:** 2026-03-29 | **Model:** static

## Purpose

- Exports: withDefaults, DEFAULT_INCLUDE, DEFAULT_EXCLUDE, DEFAULT_STALE_THRESHOLD_DAYS

| Type | Detail |
|------|--------|
| code | Exported symbols: withDefaults, DEFAULT_INCLUDE, DEFAULT_EXCLUDE, DEFAULT_STALE_THRESHOLD_DAYS |
| graph | Consumed by: /home/runner/work/braito/braito/src/core/config/loadConfig.ts, /home/runner/work/braito/braito/src/core/output/buildIndex.ts |


## Sensitive Dependencies

- /home/runner/work/braito/braito/src/core/config/loadConfig.ts
- /home/runner/work/braito/braito/src/core/output/buildIndex.ts

| Type | Detail |
|------|--------|
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/config/loadConfig.ts |
| graph | Reverse dep: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |


## Known Pitfalls

- Co-changes frequently with: /home/runner/work/braito/braito/src/cli/commands/generate.ts, /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts, /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts, /home/runner/work/braito/braito/src/core/types/file-analysis.ts, /home/runner/work/braito/braito/src/core/types/project.ts, /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts

| Type | Detail |
|------|--------|
| git | Co-changed 2x with /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/types/file-analysis.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/src/core/types/project.ts |
| git | Co-changed 2x with /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |

## Impact Validation

- /home/runner/work/braito/braito/src/core/config/loadConfig.ts
- /home/runner/work/braito/braito/src/core/output/buildIndex.ts
- /home/runner/work/braito/braito/src/cli/commands/generate.ts
- /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts
- /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts
- /home/runner/work/braito/braito/src/core/types/file-analysis.ts
- /home/runner/work/braito/braito/src/core/types/project.ts
- /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts
- /home/runner/work/braito/braito/CHANGELOG.md
- /home/runner/work/braito/braito/TODO.md
- /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts

| Type | Detail |
|------|--------|
| graph | Consumer: /home/runner/work/braito/braito/src/core/config/loadConfig.ts |
| graph | Consumer: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/cli/commands/generate.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/ast/analyzers/ts/extractComments.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/output/buildBasicNote.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/types/file-analysis.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/src/core/types/project.ts |
| git | Co-changed 2x: /home/runner/work/braito/braito/tests/output/buildBasicNote.test.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/CHANGELOG.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/TODO.md |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/cache/isNoteStale.ts |
| git | Co-changed 1x: /home/runner/work/braito/braito/src/core/output/buildIndex.ts |
