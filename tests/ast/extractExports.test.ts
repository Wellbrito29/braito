import { describe, it, expect } from 'bun:test'
import { Project } from 'ts-morph'
import { extractExports } from '../../src/core/ast/analyzers/ts/extractExports.ts'

function makeSourceFile(code: string) {
  const project = new Project({ useInMemoryFileSystem: true })
  return project.createSourceFile('test.ts', code)
}

describe('extractExports', () => {
  it('extracts named function exports', () => {
    const src = makeSourceFile(`
      export function useSearch() {}
      export function loadData() {}
    `)
    const result = extractExports(src)
    expect(result).toContain('useSearch')
    expect(result).toContain('loadData')
  })

  it('extracts const exports', () => {
    const src = makeSourceFile(`
      export const VERSION = '1.0.0'
      export const config = {}
    `)
    const result = extractExports(src)
    expect(result).toContain('VERSION')
    expect(result).toContain('config')
  })

  it('extracts class exports', () => {
    const src = makeSourceFile(`export class FileLoader {}`)
    const result = extractExports(src)
    expect(result).toContain('FileLoader')
  })

  it('returns empty for no exports', () => {
    const src = makeSourceFile(`const x = 1`)
    expect(extractExports(src)).toHaveLength(0)
  })
})
