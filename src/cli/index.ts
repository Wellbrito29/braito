#!/usr/bin/env bun
import { parseArgs } from 'node:util'
import { runScan } from './commands/scan.ts'
import { runGenerate } from './commands/generate.ts'
import { runWatch } from './commands/watch.ts'
import { runMcp } from './commands/mcp.ts'
import { runUi } from './commands/ui.ts'

const [, , command, ...rest] = process.argv

const { values } = parseArgs({
  args: rest,
  options: {
    root: { type: 'string', short: 'r' },
    force: { type: 'boolean', short: 'f' },
    filter: { type: 'string' },
  },
  strict: false,
})

switch (command) {
  case 'scan':
    await runScan({ root: values.root })
    break

  case 'generate':
    await runGenerate({ root: values.root, force: values.force, filter: values.filter })
    break

  case 'watch':
    await runWatch({ root: values.root })
    break

  case 'mcp':
    await runMcp({ root: values.root })
    break

  case 'ui': {
    const portStr = (values as Record<string, unknown>).port as string | undefined
    await runUi({ root: values.root, port: portStr ? parseInt(portStr) : undefined })
    break
  }

  default:
    console.log(`
braito — AI File Notes

Usage:
  bun src/cli/index.ts <command> [options]

Commands:
  scan      Discover and list eligible files
  generate  Analyze files and write .ai-notes/ sidecars
  watch     Watch for changes and regenerate notes incrementally
  mcp       Start the MCP server (JSON-RPC 2.0 over stdio)
  ui        Start the local web UI to browse notes

Options:
  --root, -r <path>      Root directory to analyze (default: cwd)
  --force, -f            Bypass cache and reprocess all files (generate only)
  --filter <glob>        Scope generation to files matching a glob pattern (generate only)
`)
    process.exit(command ? 1 : 0)
}
