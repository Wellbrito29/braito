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
# List all eligible files in your project
bun src/cli/index.ts scan --root /path/to/your/project

# Generate notes for all files (static-only, no LLM)
bun src/cli/index.ts generate --root /path/to/your/project
```

This creates a `.ai-notes/` directory with one `.json` + `.md` sidecar per file, plus an `index.json` and `index.md` summary.

## Enable LLM synthesis

Set your API key and configure a provider in `ai-notes.config.ts`:

```ts
// ai-notes.config.ts
export default {
  llm: {
    provider: 'anthropic',          // 'anthropic' | 'openai' | 'ollama'
    model: 'claude-sonnet-4-6',
    llmThreshold: 0.4,              // only files above this score get LLM synthesis
  },
}
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun src/cli/index.ts generate --root ./
```

Files with `criticalityScore >= llmThreshold` are sent to the LLM. All others get a fast static note.

## CLI commands

| Command | Description |
|---|---|
| `scan --root ./` | Discover and list eligible files |
| `scan --root ./ --format json` | Machine-readable file list |
| `generate --root ./` | Full pipeline — writes `.ai-notes/` |
| `generate --root ./ --force` | Bypass cache, reprocess all files |
| `generate --root ./ --filter src/core/**` | Scope to a subdirectory |
| `generate --root ./ --language pt-BR` | LLM output in a specific language |
| `generate --root ./ --diff` | Show field-level diff between runs |
| `generate --root ./ --dry-run` | Preview without writing files |
| `watch --root ./` | Watch mode — regenerate on file change |
| `mcp --root ./` | Start MCP server (JSON-RPC 2.0 over stdio) |
| `mcp --root ./ --auto-generate` | Generate notes if missing, then start MCP |
| `ui --root ./` | Local web UI at `http://localhost:7842` |
| `init --agent --root ./` | Generate AI assistant slash command files |

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
