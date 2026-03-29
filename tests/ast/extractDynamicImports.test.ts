import { describe, it, expect } from 'bun:test'
import { Project } from 'ts-morph'
import { extractImports } from '../../src/core/ast/analyzers/ts/extractImports.ts'

function makeSourceFile(code: string) {
  const project = new Project({ useInMemoryFileSystem: true })
  return project.createSourceFile('test.ts', code)
}

describe('extractImports — dynamic imports', () => {
  it('detects a local dynamic import with single quotes', () => {
    const src = makeSourceFile(`const mod = import('./utils/helper')`)
    const result = extractImports(src)
    expect(result.all).toContain('./utils/helper')
    expect(result.local).toContain('./utils/helper')
    expect(result.external).not.toContain('./utils/helper')
  })

  it('detects a local dynamic import with double quotes', () => {
    const src = makeSourceFile(`const mod = import("../shared/api")`)
    const result = extractImports(src)
    expect(result.all).toContain('../shared/api')
    expect(result.local).toContain('../shared/api')
  })

  it('detects an external dynamic import', () => {
    const src = makeSourceFile(`const mod = import('lodash')`)
    const result = extractImports(src)
    expect(result.all).toContain('lodash')
    expect(result.external).toContain('lodash')
    expect(result.local).not.toContain('lodash')
  })

  it('detects dynamic imports using no-substitution template literals', () => {
    const src = makeSourceFile('const mod = import(`./components/Widget`)')
    const result = extractImports(src)
    expect(result.all).toContain('./components/Widget')
    expect(result.local).toContain('./components/Widget')
  })

  it('ignores dynamic imports with runtime expressions (template with vars)', () => {
    const src = makeSourceFile('const mod = import(`./plugins/${name}`)')
    const result = extractImports(src)
    // Template with substitution — specifier is not a static string, should not appear
    expect(result.all).not.toContain('./plugins/${name}')
    expect(result.all).toHaveLength(0)
  })

  it('combines static and dynamic imports without duplicates in ordering', () => {
    const src = makeSourceFile(`
      import { useState } from 'react'
      import { foo } from './foo'
      async function load() {
        const bar = await import('./bar')
        const lodash = await import('lodash')
      }
    `)
    const result = extractImports(src)
    expect(result.all).toContain('react')
    expect(result.all).toContain('./foo')
    expect(result.all).toContain('./bar')
    expect(result.all).toContain('lodash')
    expect(result.local).toContain('./foo')
    expect(result.local).toContain('./bar')
    expect(result.external).toContain('react')
    expect(result.external).toContain('lodash')
    expect(result.all).toHaveLength(4)
  })

  it('returns empty arrays when no imports at all', () => {
    const src = makeSourceFile(`export const x = 1`)
    const result = extractImports(src)
    expect(result.all).toHaveLength(0)
    expect(result.local).toHaveLength(0)
    expect(result.external).toHaveLength(0)
  })

  it('handles multiple dynamic imports in the same file', () => {
    const src = makeSourceFile(`
      const a = import('./a')
      const b = import('./b')
      const c = import('external-lib')
    `)
    const result = extractImports(src)
    expect(result.local).toContain('./a')
    expect(result.local).toContain('./b')
    expect(result.external).toContain('external-lib')
    expect(result.all).toHaveLength(3)
  })
})
