import { describe, it, expect } from 'bun:test'
import path from 'node:path'
import { buildDependencyGraph } from '../../src/core/graph/buildDependencyGraph.ts'
import { buildReverseDependencyGraph } from '../../src/core/graph/buildReverseDependencyGraph.ts'
import type { StaticFileAnalysis } from '../../src/core/types/file-analysis.ts'

const root = '/project'

function makeAnalysis(filePath: string, localImports: string[]): StaticFileAnalysis {
  return {
    filePath,
    imports: localImports,
    localImports,
    externalImports: [],
    exports: [],
    symbols: [],
    hooks: [],
    envVars: [],
    apiCalls: [],
    comments: { todo: [], fixme: [], hack: [] },
    hasSideEffects: false,
  }
}

describe('buildDependencyGraph', () => {
  it('maps files to their resolved local dependencies', () => {
    const analyses = [
      makeAnalysis('/project/src/a.ts', ['./b']),
      makeAnalysis('/project/src/b.ts', []),
    ]

    const graph = buildDependencyGraph(analyses, root)

    const aDeps = graph.get('/project/src/a.ts')
    expect(aDeps).toContain('/project/src/b.ts')
  })

  it('returns empty deps for files with no local imports', () => {
    const analyses = [makeAnalysis('/project/src/b.ts', [])]
    const graph = buildDependencyGraph(analyses, root)
    expect(graph.get('/project/src/b.ts')).toHaveLength(0)
  })
})

describe('buildReverseDependencyGraph', () => {
  it('maps files to their consumers', () => {
    const graph = new Map([
      ['/project/src/a.ts', ['/project/src/b.ts']],
      ['/project/src/b.ts', []],
    ])

    const reverse = buildReverseDependencyGraph(graph)

    expect(reverse.get('/project/src/b.ts')).toContain('/project/src/a.ts')
    expect(reverse.get('/project/src/a.ts')).toHaveLength(0)
  })
})
