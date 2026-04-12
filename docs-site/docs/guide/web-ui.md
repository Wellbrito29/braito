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

### Graph tab

Interactive force-directed dependency graph powered by D3.js:

| Feature | Description |
|---|---|
| **Node colors** | Each domain gets a unique color from a 12-color palette |
| **Node size** | Proportional to `criticalityScore` (range: 4–16px radius) |
| **Directed edges** | Arrow markers show import direction (importer → imported) |
| **Hover** | Highlights the hovered node and its direct neighbors; dims everything else; tooltip shows path, score, and domain |
| **Click** | Loads the clicked file's note in the detail panel |
| **Drag** | Reposition individual nodes in the force simulation |
| **Zoom/Pan** | Mouse wheel to zoom, drag background to pan |
| **Min-score filter** | Slider to hide nodes below a criticality threshold — useful for large graphs with 300+ nodes |
| **Labels** | File names shown for nodes with score >= 0.5 |

The graph loads data from `GET /api/graph`, which serves `.ai-notes/graph.json` (generated during `generate`). Falls back to building the graph from `index.json` dependents if `graph.json` is not available.

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

Check **--force** to bypass the cache and reprocess all files. Check **--verbose** to see per-file signal detail (see below). The file list and coverage stats refresh automatically when the run completes.

### Verbose mode

When **--verbose** is checked, the log panel shows a detailed line for every processed file:

```
0.82  src/core/types/ai-note.ts  deps=0 consumers=8 churn=12  [no-tests LLM]
0.71  src/core/output/buildBasicNote.ts  deps=6 consumers=3 churn=8  [ext-imports LLM]
0.45  src/core/utils/logger.ts  deps=1 consumers=5 churn=3  []
```

Each line shows: criticality score · file path · dependency and consumer counts · churn · active signal flags.

At the end of the run, verbose mode also prints:

- **Top 5 files by consumers** — the most-imported files in the graph (high blast radius)
- **Top 5 files by score** — the files with the highest criticality
- **Files without tests** — count of untested files vs total

Use verbose mode to understand why scores are high, spot bottlenecks, and decide where to add tests or reduce coupling.
