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
- **Score badge** — color-coded: red (≥0.7), yellow (≥0.4), green (<0.4)

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
| **Score breakdown** | Per-field signal bars showing what contributed to the criticality score |
| **Evidence trail** | All `evidence[]` items across every field, with type badges (`code`, `git`, `test`, `graph`, `comment`, `doc`) |
| **Changelog** | Last 10 commits for the file: short hash, date, message, author |

The Debug tab is especially useful for understanding why a note is vague — you can see exactly what signals were available at analysis time.
