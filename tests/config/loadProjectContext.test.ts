import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { loadProjectContext } from '../../src/core/config/loadProjectContext.ts'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-ctx-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('loadProjectContext', () => {
  it('returns null when braito.context.md does not exist', () => {
    expect(loadProjectContext(tmpDir)).toBeNull()
  })

  it('returns null when braito.context.md is empty', () => {
    fs.writeFileSync(path.join(tmpDir, 'braito.context.md'), '   \n  ')
    expect(loadProjectContext(tmpDir)).toBeNull()
  })

  it('returns the trimmed content when file exists', () => {
    const content = '# My Context\n\n- Domain vocab here'
    fs.writeFileSync(path.join(tmpDir, 'braito.context.md'), `  ${content}  `)
    expect(loadProjectContext(tmpDir)).toBe(content)
  })

  it('returns content as-is when under 4000 chars', () => {
    const content = 'x'.repeat(3999)
    fs.writeFileSync(path.join(tmpDir, 'braito.context.md'), content)
    expect(loadProjectContext(tmpDir)).toBe(content)
  })

  it('truncates content at 4000 chars and appends truncation marker', () => {
    const content = 'x'.repeat(5000)
    fs.writeFileSync(path.join(tmpDir, 'braito.context.md'), content)
    const result = loadProjectContext(tmpDir)
    expect(result).not.toBeNull()
    expect(result!.length).toBeLessThan(5000)
    expect(result!.endsWith('\n...(truncated)')).toBe(true)
    expect(result!.startsWith('x'.repeat(4000))).toBe(true)
  })
})
