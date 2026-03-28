import { describe, it, expect } from 'bun:test'
import { Project } from 'ts-morph'
import { extractComments } from '../../src/core/ast/analyzers/ts/extractComments.ts'

function makeSourceFile(code: string) {
  const project = new Project({ useInMemoryFileSystem: true })
  return project.createSourceFile('test.ts', code)
}

describe('extractComments', () => {
  it('extracts TODO comments', () => {
    const src = makeSourceFile(`
      // TODO: remove legacy fallback
      const x = 1
    `)
    const result = extractComments(src)
    expect(result.todo.length).toBeGreaterThan(0)
    expect(result.todo[0]).toContain('TODO')
  })

  it('extracts FIXME comments', () => {
    const src = makeSourceFile(`
      // FIXME: handle null case
      const y = null
    `)
    const result = extractComments(src)
    expect(result.fixme.length).toBeGreaterThan(0)
  })

  it('extracts HACK comments', () => {
    const src = makeSourceFile(`
      // HACK: workaround for library bug
      const z = {}
    `)
    const result = extractComments(src)
    expect(result.hack.length).toBeGreaterThan(0)
  })

  it('returns empty when no special comments', () => {
    const src = makeSourceFile(`// just a regular comment\nconst x = 1`)
    const result = extractComments(src)
    expect(result.todo).toHaveLength(0)
    expect(result.fixme).toHaveLength(0)
    expect(result.hack).toHaveLength(0)
  })
})
