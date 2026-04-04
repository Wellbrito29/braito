---
sidebar_position: 5
---

# Watch Mode

Watch mode monitors your source files and regenerates notes automatically when a file changes.

## Start

```bash
bun src/cli/index.ts watch --root ./

# With a specific output language
bun src/cli/index.ts watch --root ./ --language pt-BR
```

## Behaviour

- On startup, runs a full `generate` pass for all files not already in cache.
- Watches all files matching your `include` patterns for changes.
- On each change: re-analyzes the modified file, updates its `.json` and `.md` note, and rebuilds `index.json` and `index.md`.
- Cache is updated so unchanged files are never reprocessed.
- LLM synthesis is triggered for changed files that meet the `llmThreshold`, same as a normal `generate` run.

## Use cases

- Active development: notes stay fresh as you edit files.
- Combined with the [Web UI](./web-ui): open `http://localhost:7842` in another terminal and reload to see updated notes.
- Combined with the [MCP server](./mcp-server): your AI assistant always has current context.

:::tip
Watch mode is most useful during active development on a complex module. For CI, use `generate` instead.
:::
