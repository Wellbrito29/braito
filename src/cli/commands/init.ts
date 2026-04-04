import path from 'node:path'
import fs from 'node:fs'
import { logger } from '../../core/utils/logger.ts'

const CLAUDE_COMMANDS_DIR = '.claude/commands'

const COMMANDS: Record<string, string> = {
  'braito-note.md': `# Show note for current file

Show the braito AI note for a specific file. If no path is provided, show the note for the currently open file.

Usage: /braito-note [file-path]

\`\`\`bash
bun src/cli/index.ts mcp --root ./
\`\`\`

Use the \`get_file_note\` MCP tool with the file path to retrieve the full note including purpose, invariants, sensitive dependencies, important decisions, known pitfalls, and impact validation.

If the notes are missing, run:
\`\`\`bash
bun src/cli/index.ts generate --root ./
\`\`\`
`,

  'braito-impact.md': `# Show blast-radius impact for a file

Show which files are affected when a given file changes, using braito's reverse dependency graph and BFS traversal.

Usage: /braito-impact <file-path>

Use the \`get_impact\` MCP tool with the file path to retrieve:
- Total number of directly and transitively affected files
- Per-level breakdown with criticality scores and domain
- High-criticality files that are in the blast radius

This is useful before refactoring or making breaking changes to understand the full impact surface.
`,

  'braito-search.md': `# Search braito notes by keyword

Search across all generated notes for a keyword or concept. Matches against observed facts, LLM-inferred content, and evidence details.

Usage: /braito-search <query>

Use the \`search\` MCP tool with your query string to find:
- Files where the concept appears in purpose, invariants, or pitfalls
- Evidence items matching the query
- Files sorted by relevance and criticality

Examples:
- /braito-search "authentication"
- /braito-search "race condition"
- /braito-search "env var"
`,
}

export async function runInit(args: { root?: string; agent?: boolean }): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())

  if (!args.agent) {
    logger.info('Usage: braito init --agent')
    logger.info('  --agent    Generate AI assistant slash command files (.claude/commands/)')
    return
  }

  const commandsDir = path.join(root, CLAUDE_COMMANDS_DIR)
  fs.mkdirSync(commandsDir, { recursive: true })

  let written = 0
  for (const [filename, content] of Object.entries(COMMANDS)) {
    const filePath = path.join(commandsDir, filename)
    fs.writeFileSync(filePath, content, 'utf-8')
    logger.info(`  Created: ${path.relative(root, filePath)}`)
    written++
  }

  logger.success(`Generated ${written} slash command files in ${CLAUDE_COMMANDS_DIR}/`)
  logger.info('')
  logger.info('Available commands in Claude Code / Cursor:')
  logger.info('  /braito-note   — show the note for a file')
  logger.info('  /braito-impact — show blast-radius impact analysis')
  logger.info('  /braito-search — search notes by keyword')
  logger.info('')
  logger.info('To activate: make sure the braito MCP server is configured in your editor.')
  logger.info('  See: https://wellbrito29.github.io/braito/guide/mcp-server')
}
