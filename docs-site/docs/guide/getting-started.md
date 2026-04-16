---
sidebar_position: 1
---

# Getting Started

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A TypeScript or JavaScript project with a git repository

## Installation

```bash
# Clone the repo
git clone https://github.com/wellbrito29/braito.git
cd braito

# Install dependencies
bun install
```

## First run

```bash
bun run scan        # list all eligible files
bun run generate    # generate notes (static-only, no LLM)
```

This creates a `.ai-notes/` directory with one `.json` + `.md` sidecar per file, plus an `index.json` and `index.md` summary.

## Enable LLM synthesis

Set your API key and configure a provider in `ai-notes.config.ts`:

```ts
// ai-notes.config.ts
export default {
  llm: {
    provider: 'anthropic',          // 'anthropic' | 'openai' | 'ollama' | 'claude-cli'
    model: 'claude-sonnet-4-6',
    llmThreshold: 0.4,              // only files above this score get LLM synthesis
  },
}
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun run generate
```

Files with `criticalityScore >= llmThreshold` are sent to the LLM. All others get a fast static note.

## CLI commands

| Script | Equivalent flags | Description |
|---|---|---|
| `bun run scan` | `--format json` | Discover and list eligible files |
| `bun run generate` | `--filter` `--diff` `--language` | Full pipeline — writes `.ai-notes/` |
| `bun run generate:force` | — | Bypass cache, reprocess all files |
| `bun run generate:dry` | — | Preview without writing files |
| `bun run generate:v` | — | Per-file signal detail + phase timers |
| `bun run watch` | — | Regenerate on file change |
| `bun run mcp` | `--auto-generate` | MCP server (JSON-RPC 2.0 over stdio) |
| `bun run ui` | `--port <n>` | Local web UI at `http://localhost:7842` |
| `bun run init:agent` | — | Generate `.claude/commands/` slash command files |
| `bun test` | — | Run all test suites |

## Generated output

```
.ai-notes/
  src/
    core/
      scanner/discoverFiles.ts.json   ← structured note
      scanner/discoverFiles.ts.md     ← human-readable sidecar
  index.json                          ← all files ranked by criticality
  index.md                            ← grouped by domain

cache/
  hashes.json                         ← SHA-1 per file for incremental runs
```

Do not edit `.ai-notes/` or `cache/` manually — they are regenerated on each run.

## Next steps

- [Configuration](./configuration) — all config options
- [MCP Server](./mcp-server) — connect to Cursor or Claude Code
- [Web UI](./web-ui) — browse notes in the browser
