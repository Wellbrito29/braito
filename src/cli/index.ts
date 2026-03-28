#!/usr/bin/env bun
import { parseArgs } from 'node:util'
import { runScan } from './commands/scan.ts'
import { runGenerate } from './commands/generate.ts'

const [, , command, ...rest] = process.argv

const { values } = parseArgs({
  args: rest,
  options: {
    root: { type: 'string', short: 'r' },
  },
  strict: false,
})

switch (command) {
  case 'scan':
    await runScan({ root: values.root })
    break

  case 'generate':
    await runGenerate({ root: values.root })
    break

  default:
    console.log(`
braito — AI File Notes

Usage:
  bun src/cli/index.ts <command> [options]

Commands:
  scan      Discover and list eligible files
  generate  Analyze files and write .ai-notes/ sidecars

Options:
  --root, -r <path>   Root directory to analyze (default: cwd)
`)
    process.exit(command ? 1 : 0)
}
