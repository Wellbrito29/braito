import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { buildDependencyGraph, updateDependencyGraph } from '../../src/core/graph/buildDependencyGraph.ts'
import { buildReverseDependencyGraph } from '../../src/core/graph/buildReverseDependencyGraph.ts'
import type { StaticFileAnalysis } from '../../src/core/types/file-analysis.ts'

let tmpDir: string

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-graph-test-'))
  fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true })
  fs.writeFileSync(path.join(tmpDir, 'src', 'a.ts'), "import './b'")
  fs.writeFileSync(path.join(tmpDir, 'src', 'b.ts'), '')
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

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
    const aPath = path.join(tmpDir, 'src', 'a.ts')
    const bPath = path.join(tmpDir, 'src', 'b.ts')
    const analyses = [
      makeAnalysis(aPath, ['./b']),
      makeAnalysis(bPath, []),
    ]

    const graph = buildDependencyGraph(analyses, tmpDir)

    const aDeps = graph.get(aPath)
    expect(aDeps).toContain(bPath)
  })

  it('returns empty deps for files with no local imports', () => {
    const bPath = path.join(tmpDir, 'src', 'b.ts')
    const analyses = [makeAnalysis(bPath, [])]
    const graph = buildDependencyGraph(analyses, tmpDir)
    expect(graph.get(bPath)).toHaveLength(0)
  })
})

describe('updateDependencyGraph', () => {
  it('updates a single file entry without affecting others', () => {
    const aPath = path.join(tmpDir, 'src', 'a.ts')
    const bPath = path.join(tmpDir, 'src', 'b.ts')

    const graph = new Map<string, string[]>([
      [aPath, []],
      [bPath, []],
    ])

    updateDependencyGraph(graph, makeAnalysis(aPath, ['./b']), tmpDir)

    expect(graph.get(aPath)).toContain(bPath)
    expect(graph.get(bPath)).toHaveLength(0)
  })
})

describe('buildReverseDependencyGraph', () => {
  it('maps files to their consumers', () => {
    const aPath = path.join(tmpDir, 'src', 'a.ts')
    const bPath = path.join(tmpDir, 'src', 'b.ts')

    const graph = new Map([
      [aPath, [bPath]],
      [bPath, []],
    ])

    const reverse = buildReverseDependencyGraph(graph)

    expect(reverse.get(bPath)).toContain(aPath)
    expect(reverse.get(aPath)).toHaveLength(0)
  })
})
