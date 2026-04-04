import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { runInit } from '../../src/cli/commands/init.ts'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-init-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('runInit --agent', () => {
  it('creates .claude/commands/ directory', async () => {
    await runInit({ root: tmpDir, agent: true })
    expect(fs.existsSync(path.join(tmpDir, '.claude/commands'))).toBe(true)
  })

  it('generates braito-note.md', async () => {
    await runInit({ root: tmpDir, agent: true })
    const content = fs.readFileSync(path.join(tmpDir, '.claude/commands/braito-note.md'), 'utf-8')
    expect(content).toContain('braito-note')
    expect(content).toContain('get_file_note')
  })

  it('generates braito-impact.md', async () => {
    await runInit({ root: tmpDir, agent: true })
    const content = fs.readFileSync(path.join(tmpDir, '.claude/commands/braito-impact.md'), 'utf-8')
    expect(content).toContain('get_impact')
  })

  it('generates braito-search.md', async () => {
    await runInit({ root: tmpDir, agent: true })
    const content = fs.readFileSync(path.join(tmpDir, '.claude/commands/braito-search.md'), 'utf-8')
    expect(content).toContain('search')
  })

  it('is idempotent — re-running overwrites without error', async () => {
    await runInit({ root: tmpDir, agent: true })
    await runInit({ root: tmpDir, agent: true })
    expect(fs.existsSync(path.join(tmpDir, '.claude/commands/braito-note.md'))).toBe(true)
  })
})
