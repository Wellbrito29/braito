#!/usr/bin/env bun
import { parseArgs } from 'node:util'
import { logger } from '../core/utils/logger.ts'
import { runScan } from './commands/scan.ts'
import { runGenerate } from './commands/generate.ts'
import { runWatch } from './commands/watch.ts'
import { runMcp } from './commands/mcp.ts'
import { runUi } from './commands/ui.ts'

const [, , command, ...rest] = process.argv

const { values } = parseArgs({
  args: rest,
  options: {
    root:    { type: 'string',  short: 'r' },
    force:   { type: 'boolean', short: 'f' },
    filter:  { type: 'string' },
    format:  { type: 'string' },
    debug:   { type: 'boolean' },
    silent:  { type: 'boolean' },
    verbose: { type: 'boolean', short: 'v' },
  },
  strict: false,
})

// Configure log level from flags (debug > verbose > silent > default)
if (values.debug) {
  logger.setLevel('debug')
  logger.enableTimestamps()
} else if (values.verbose) {
  logger.setLevel('debug')
} else if (values.silent) {
  logger.setLevel('error')
}

switch (command) {
  case 'scan': {
    const fmt = values.format as 'table' | 'json' | undefined
    await runScan({ root: values.root, format: fmt })
    break
  }

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
<<<<<<< HEAD
  --debug                Enable debug-level logging with timestamps
  --verbose, -v          Enable verbose logging (same as --debug, no timestamps)
  --silent               Suppress all output except errors
  --format <fmt>         Output format for scan: "table" (default) or "json" (scan only)
`)
    process.exit(command ? 1 : 0)
}
