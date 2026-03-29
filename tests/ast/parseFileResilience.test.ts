import { describe, it, expect, afterEach, spyOn } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseFile } from '../../src/core/ast/parseFile.ts'
import * as extractImportsModule from '../../src/core/ast/analyzers/ts/extractImports.ts'

describe('parseFile error resilience', () => {
  const tempFiles: string[] = []

  function createTempFile(content: string, ext = '.ts'): string {
    const filePath = path.join(os.tmpdir(), `braito-test-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
    fs.writeFileSync(filePath, content, 'utf-8')
    tempFiles.push(filePath)
    return filePath
  }

  afterEach(() => {
    for (const f of tempFiles.splice(0)) {
      try { fs.unlinkSync(f) } catch { /* ignore */ }
    }
  })

  it('returns empty analysis when an extractor throws instead of crashing', () => {
    const filePath = createTempFile('export const x = 1')

    // Force an error inside the ts-morph pipeline by making an extractor throw
    const spy = spyOn(extractImportsModule, 'extractImports').mockImplementation(() => {
      throw new Error('Simulated extractor failure')
    })

    let result: ReturnType<typeof parseFile>
    try {
      result = parseFile(filePath)
    } finally {
      spy.mockRestore()
    }

    expect(result!).toBeDefined()
    expect(result!.filePath).toBe(filePath)
    expect(result!.imports).toEqual([])
    expect(result!.exports).toEqual([])
    expect(result!.symbols).toEqual([])
  })

  it('sets filePath correctly on the returned empty analysis when an error occurs', () => {
    const filePath = createTempFile('export const y = 2')

    const spy = spyOn(extractImportsModule, 'extractImports').mockImplementation(() => {
      throw new Error('Simulated failure')
    })

    let result: ReturnType<typeof parseFile>
    try {
      result = parseFile(filePath)
    } finally {
      spy.mockRestore()
    }

    expect(result!.filePath).toBe(filePath)
  })

  it('returns empty arrays for all collection fields on parse failure', () => {
    const filePath = createTempFile('export const z = 3')

    const spy = spyOn(extractImportsModule, 'extractImports').mockImplementation(() => {
      throw new Error('Simulated failure')
    })

    let result: ReturnType<typeof parseFile>
    try {
      result = parseFile(filePath)
    } finally {
      spy.mockRestore()
    }

    expect(result!.imports).toEqual([])
    expect(result!.localImports).toEqual([])
    expect(result!.externalImports).toEqual([])
    expect(result!.exports).toEqual([])
    expect(result!.symbols).toEqual([])
    expect(result!.hooks).toEqual([])
    expect(result!.envVars).toEqual([])
    expect(result!.apiCalls).toEqual([])
    expect(result!.comments.todo).toEqual([])
    expect(result!.comments.fixme).toEqual([])
    expect(result!.comments.hack).toEqual([])
    expect(result!.comments.invariant).toEqual([])
    expect(result!.comments.decision).toEqual([])
    expect(result!.hasSideEffects).toBe(false)
  })

  it('returns empty analysis when trying to parse a non-existent file path', () => {
    const filePath = '/tmp/this-file-does-not-exist-braito-test.ts'

    const result = parseFile(filePath)

    expect(result).toBeDefined()
    expect(result.filePath).toBe(filePath)
    expect(result.imports).toEqual([])
    expect(result.exports).toEqual([])
  })

  it('still parses valid TypeScript files correctly', () => {
    const filePath = createTempFile(`
      import { foo } from './foo'
      export const bar = 42
    `)

    const result = parseFile(filePath)

    expect(result.filePath).toBe(filePath)
    expect(result.imports).toContain('./foo')
    expect(result.exports).toContain('bar')
  })
})
