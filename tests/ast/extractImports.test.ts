import { describe, it, expect } from 'bun:test'
import { Project } from 'ts-morph'
import { extractImports } from '../../src/core/ast/analyzers/ts/extractImports.ts'

function makeSourceFile(code: string) {
  const project = new Project({ useInMemoryFileSystem: true })
  return project.createSourceFile('test.ts', code)
}

describe('extractImports', () => {
  it('separates local from external imports', () => {
    const src = makeSourceFile(`
      import { useState } from 'react'
      import { foo } from './foo'
      import { bar } from '../bar'
      import { baz } from '@/utils/baz'
    `)

    const result = extractImports(src)

    expect(result.external).toContain('react')
    expect(result.local).toContain('./foo')
    expect(result.local).toContain('../bar')
    expect(result.local).toContain('@/utils/baz')
    expect(result.all).toHaveLength(4)
  })

  it('returns empty arrays when no imports', () => {
    const src = makeSourceFile(`export const x = 1`)
    const result = extractImports(src)
    expect(result.all).toHaveLength(0)
    expect(result.local).toHaveLength(0)
    expect(result.external).toHaveLength(0)
  })
})
