---
sidebar_position: 4
---

# Web UI

braito includes a local single-page application for browsing generated notes.

## Start

```bash
bun src/cli/index.ts ui --root ./
# → http://localhost:7842
```

Custom port:

```bash
bun src/cli/index.ts ui --root ./ --port 3000
```

## Features

### Sidebar

- **Search** — filter files by path as you type
- **Min score filter** — show only files above a criticality threshold (default 0.5+)
- **Domain grouping** — files grouped by folder domain, sorted by max score descending
- **Stale badge** — ⚠ indicator for notes older than `staleThresholdDays`
- **Score badge** — color-coded: red (≥0.7), yellow (≥0.4), green (&lt;0.4)

### Note tab

Shows the six semantic fields for the selected file:

| Field | Content |
|---|---|
| **Purpose** | What the file does and why it exists |
| **Invariants** | Contracts and assumptions that must hold |
| **Important Decisions** | Architectural choices backed by real signals |
| **Known Pitfalls** | Failure modes from TODOs, risky commits, and co-changes |
| **Sensitive Dependencies** | External packages, env vars, high-fanout consumers |
| **Impact Validation** | Where to verify before deploying a change |

Each field shows `observed` items (from static analysis) and `inferred` items (from LLM, in italics).

### Debug tab

Reveals the full analysis behind each note:

| Section | Content |
|---|---|
| **Score breakdown** | Per-signal bars showing each contribution to the criticality score with `+X.XX` labels |
| **Evidence trail** | All `evidence[]` items across every field, with type badges (`code`, `git`, `test`, `graph`, `comment`, `doc`) |
| **Co-changed files** | Files that frequently change together with this one (from git history), sorted by co-change count |
| **Changelog** | Last 10 commits for the file: short hash, date, message, author |

The Debug tab is especially useful for understanding why a file has a high score — you can see exactly what signals drove the result.

### Tests tab

Shows test coverage signals for the selected file:

| Section | Content |
|---|---|
| **Status badge** | **Covered ✓** (green) or **Uncovered ✗** (red) based on related test file detection |
| **Coverage bar** | Line coverage percentage with color-coded bar (green ≥70%, yellow ≥40%, red &lt;40%) |
| **Related test files** | Test files associated with this source file |
| **Raw signals** | `hasTests`, `coveragePct`, `churnScore`, `authorCount` from `debugSignals` |

Uncovered files with consumers incur a higher criticality penalty (+0.15 vs +0.05), making the Tests tab a useful guide for where to add tests first.

### Test coverage stats

A stats strip above the file list shows global test coverage at a glance:

- **files** — total number of generated notes
- **covered** — files with at least one related test detected
- **uncovered** — files with no tests
- **avg cov** — average line coverage across files that have coverage data

### Running generate from the UI

The **▶ Run generate** button in the header triggers the full pipeline directly from the browser without opening a terminal.

```
▶ Run generate   [ ] --force
```

A log panel slides up from the bottom showing each step in real time:

```
12:04:01 · braito.context.md loaded — injecting project context…
12:04:01 📂 Found 24 files
12:04:02 🔍 Analyzing files…
12:04:03 💾 Reused 18 cached analyses (skipped ts-morph parse)
12:04:03 🕸 Building dependency graph…
12:04:04 ✍ Writing notes…
12:04:05 ✅ Generated 6 notes in .ai-notes/
12:04:05 ⏭ Skipped 18 unchanged files (use --force to reprocess)
```

Check **--force** to bypass the cache and reprocess all files. The file list and coverage stats refresh automatically when the run completes.
