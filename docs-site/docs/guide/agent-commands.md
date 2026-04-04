---
sidebar_position: 7
---

# Agent Slash Commands

braito can generate native slash command files for AI coding assistants so that your braito tools (note lookup, impact analysis, search) are available as first-class commands — no copy-paste MCP configuration needed.

## Setup

Run `init --agent` once in your project root:

```bash
bun src/cli/index.ts init --agent --root ./
```

This creates three files under `.claude/commands/`:

```
.claude/
└── commands/
    ├── braito-note.md
    ├── braito-impact.md
    └── braito-search.md
```

## Available commands

Once generated, the following slash commands are available in Claude Code and Cursor:

### `/braito-note [file-path]`

Show the full braito note for a file: purpose, invariants, sensitive dependencies, important decisions, known pitfalls, and impact validation.

```
/braito-note src/core/llm/synthesizeFileNote.ts
```

### `/braito-impact <file-path>`

Show the blast-radius impact analysis for a file. Uses BFS traversal of the reverse dependency graph to list all transitively affected files, grouped by level, with criticality scores and domains.

```
/braito-impact src/core/types/ai-note.ts
```

### `/braito-search <query>`

Full-text search across all generated notes. Matches against observed facts, LLM-inferred content, and evidence details across every file in the project.

```
/braito-search "race condition"
/braito-search "authentication"
/braito-search "env var"
```

## How it works

The command files are standard Markdown files that Claude Code and Cursor pick up as custom slash commands. They instruct the assistant to use the corresponding braito MCP tool to fetch and render the result.

For this to work, you must have the braito MCP server configured in your editor. See [MCP Server](./mcp-server) for setup instructions.

## Idempotent

Running `init --agent` multiple times is safe — it overwrites the command files with the current version. Run it again after upgrading braito to get updated command definitions.

## Project constitution complement

Pair agent slash commands with a `braito.context.md` project constitution file (see [Configuration](./configuration#project-constitution)) so the AI assistant has both live note access via slash commands and structural project knowledge baked into every LLM synthesis.
