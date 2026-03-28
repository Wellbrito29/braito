import { describe, it, expect } from 'bun:test'
import { buildBasicNote } from '../../src/core/output/buildBasicNote.ts'
import type { StaticFileAnalysis, GraphSignals, TestSignals } from '../../src/core/types/file-analysis.ts'

function makeAnalysis(overrides: Partial<StaticFileAnalysis> = {}): StaticFileAnalysis {
  return {
    filePath: '/project/src/useSearch.ts',
    imports: [],
    localImports: [],
    externalImports: [],
    exports: ['useSearch'],
    symbols: ['useSearch'],
    hooks: ['useSearch'],
    envVars: [],
    apiCalls: [],
    comments: { todo: [], fixme: [], hack: [] },
    hasSideEffects: false,
    ...overrides,
  }
}

const graph: GraphSignals = {
  filePath: '/project/src/useSearch.ts',
  directDependencies: [],
  reverseDependencies: ['/project/src/SearchScreen.tsx'],
}

const tests: TestSignals = {
  filePath: '/project/src/useSearch.ts',
  relatedTests: ['/project/src/useSearch.spec.ts'],
}

describe('buildBasicNote', () => {
  it('sets model to "static"', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests)
    expect(note.model).toBe('static')
  })

  it('includes hooks in purpose.observed', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests)
    expect(note.purpose.observed.some((o) => o.includes('useSearch'))).toBe(true)
  })

  it('includes reverse deps in sensitiveDependencies.observed', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests)
    expect(note.sensitiveDependencies.observed).toContain('/project/src/SearchScreen.tsx')
  })

  it('includes related tests in impactValidation.observed', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests)
    expect(note.impactValidation.observed).toContain('/project/src/useSearch.spec.ts')
  })

  it('captures TODO comments in knownPitfalls', () => {
    const analysis = makeAnalysis({ comments: { todo: ['TODO: fix this'], fixme: [], hack: [] } })
    const note = buildBasicNote(analysis, graph, tests)
    expect(note.knownPitfalls.observed).toContain('TODO: fix this')
  })

  it('criticalityScore is between 0 and 1', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests)
    expect(note.criticalityScore).toBeGreaterThanOrEqual(0)
    expect(note.criticalityScore).toBeLessThanOrEqual(1)
  })

  it('has a valid ISO generatedAt date', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests)
    expect(() => new Date(note.generatedAt).toISOString()).not.toThrow()
  })
})
