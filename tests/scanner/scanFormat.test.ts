import { describe, it, expect, spyOn, afterEach } from 'bun:test'
import path from 'node:path'
import { runScan } from '../../src/cli/commands/scan.ts'

const fixturesRoot = path.resolve(import.meta.dir, '../fixtures')

describe('runScan --format', () => {
  afterEach(() => {
    // spies are cleared per-test via mock.restore() if needed
  })

  it('outputs valid JSON when --format json is passed', async () => {
    const lines: string[] = []
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lines.push(String(args[0]))
    })

    await runScan({ root: fixturesRoot, format: 'json' })

    spy.mockRestore()

    expect(lines.length).toBe(1)
    const parsed = JSON.parse(lines[0])
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBeGreaterThan(0)

    for (const entry of parsed) {
      expect(typeof entry.path).toBe('string')
      expect(typeof entry.extension).toBe('string')
      expect(typeof entry.size).toBe('number')
    }
  })

  it('outputs a plain list (table format) by default', async () => {
    const lines: string[] = []
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lines.push(String(args[0]))
    })

    await runScan({ root: fixturesRoot })

    spy.mockRestore()

    // Default format produces some output (logger info lines + indented file paths)
    expect(lines.length).toBeGreaterThan(0)
    // File path lines are indented with two spaces
    const fileLines = lines.filter(l => l.startsWith('  '))
    expect(fileLines.length).toBeGreaterThan(0)
    // None of the lines should be a JSON array
    expect(() => JSON.parse(lines.find(l => l.trim().startsWith('[')) ?? 'not-json')).toThrow()
  })

  it('outputs a plain list when --format table is passed explicitly', async () => {
    const lines: string[] = []
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lines.push(String(args[0]))
    })

    await runScan({ root: fixturesRoot, format: 'table' })

    spy.mockRestore()

    expect(lines.length).toBeGreaterThan(0)
    const fileLines = lines.filter(l => l.startsWith('  '))
    expect(fileLines.length).toBeGreaterThan(0)
    expect(() => JSON.parse(lines.find(l => l.trim().startsWith('[')) ?? 'not-json')).toThrow()
  })
})
