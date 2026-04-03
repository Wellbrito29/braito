# MCP Server

braito exposes your generated notes as tools for AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io) (JSON-RPC 2.0 over stdio).

## Start the server

```bash
bun src/cli/index.ts mcp --root /path/to/your/project

# Generate notes if missing, then start
bun src/cli/index.ts mcp --root /path/to/your/project --auto-generate
```

## Connect to an AI assistant

Add braito to your MCP client config. The format varies by client:

::: code-group

```json [Cursor (~/.cursor/mcp.json)]
{
  "mcpServers": {
    "braito": {
      "command": "bun",
      "args": [
        "/path/to/braito/src/cli/index.ts",
        "mcp",
        "--root",
        "/path/to/your/project"
      ]
    }
  }
}
```

```json [Claude Code (~/.claude/config.json)]
{
  "mcpServers": {
    "braito": {
      "command": "bun",
      "args": [
        "/path/to/braito/src/cli/index.ts",
        "mcp",
        "--root",
        "/path/to/your/project"
      ]
    }
  }
}
```

:::

The MCP server can run outside an IDE too — any client that speaks JSON-RPC 2.0 over stdio can connect to it.

## Available tools

| Tool | Description |
|---|---|
| `get_file_note` | Full note for a specific file path |
| `search_by_criticality` | Files above a criticality threshold, sorted descending |
| `get_index` | Complete ranked index of all notes |
| `get_architecture_context` | Synthesized overview — top critical files, domain breakdown, invariants |
| `get_impact` | Blast-radius of a file — which files depend on it (BFS, configurable depth) |
| `search` | Full-text search across all note fields |
| `get_domain` | All files in a specific domain, sorted by criticality |

## Tool details

### `get_file_note`

```json
{ "tool": "get_file_note", "arguments": { "path": "src/core/llm/synthesizeFileNote.ts" } }
```

Returns the full `AiFileNote` JSON for the specified file.

### `get_impact`

```json
{ "tool": "get_impact", "arguments": { "path": "src/core/types/ai-note.ts", "depth": 3 } }
```

Returns `{ file, totalAffected, dependents: [{ relativePath, criticalityScore, domain, level }] }` via BFS traversal of the reverse dependency graph.

### `search`

```json
{ "tool": "search", "arguments": { "query": "LLM timeout" } }
```

Searches all `observed[]`, `inferred[]`, and `evidence[].detail` arrays across every note. Returns ranked matches.

### `get_domain`

```json
{ "tool": "get_domain", "arguments": { "domain": "llm" } }
```

Returns `{ domain, fileCount, avgCriticality, files }` — all files whose path contains the domain name, sorted by score descending.
