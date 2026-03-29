import { describe, it, expect } from 'bun:test'
import { buildBasicNote } from '../../src/core/output/buildBasicNote.ts'
import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../../src/core/types/file-analysis.ts'

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

const emptyGit: GitSignals = {
  filePath: '/project/src/useSearch.ts',
  churnScore: 0,
  recentCommitMessages: [],
  coChangedFiles: [],
  authorCount: 0,
}

describe('buildBasicNote', () => {
  it('sets model to "static"', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    expect(note.model).toBe('static')
  })

  it('includes hooks in purpose.observed', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    expect(note.purpose.observed.some((o) => o.includes('useSearch'))).toBe(true)
  })

  it('includes reverse deps in sensitiveDependencies.observed', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    expect(note.sensitiveDependencies.observed).toContain('/project/src/SearchScreen.tsx')
  })

  it('includes related tests in impactValidation.observed', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    expect(note.impactValidation.observed).toContain('/project/src/useSearch.spec.ts')
  })

  it('captures TODO comments in knownPitfalls', () => {
    const analysis = makeAnalysis({ comments: { todo: ['TODO: fix this'], fixme: [], hack: [] } })
    const note = buildBasicNote(analysis, graph, tests, emptyGit)
    expect(note.knownPitfalls.observed).toContain('TODO: fix this')
  })

  it('adds risky commit messages to knownPitfalls', () => {
    const git: GitSignals = {
      ...emptyGit,
      recentCommitMessages: ['hotfix: revert search pagination', 'chore: update deps'],
    }
    const note = buildBasicNote(makeAnalysis(), graph, tests, git)
    expect(note.knownPitfalls.observed.some((o) => o.includes('hotfix'))).toBe(true)
    expect(note.knownPitfalls.evidence.some((e) => e.type === 'git')).toBe(true)
  })

  it('adds co-changed files to impactValidation.observed', () => {
    const git: GitSignals = {
      ...emptyGit,
      coChangedFiles: [{ path: '/project/src/SearchScreen.tsx', count: 5 }],
    }
    const note = buildBasicNote(makeAnalysis(), graph, tests, git)
    expect(note.impactValidation.observed).toContain('/project/src/SearchScreen.tsx')
  })

  it('high-frequency co-changes appear in knownPitfalls', () => {
    const git: GitSignals = {
      ...emptyGit,
      coChangedFiles: [{ path: '/project/src/SearchScreen.tsx', count: 3 }],
    }
    const note = buildBasicNote(makeAnalysis(), graph, tests, git)
    expect(note.knownPitfalls.observed.some((o) => o.includes('Co-changes frequently'))).toBe(true)
  })

  it('criticalityScore increases with churn', () => {
    const lowChurn = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    const highChurn = buildBasicNote(makeAnalysis(), graph, tests, { ...emptyGit, churnScore: 20 })
    expect(highChurn.criticalityScore).toBeGreaterThan(lowChurn.criticalityScore)
  })

  it('criticalityScore is between 0 and 1', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    expect(note.criticalityScore).toBeGreaterThanOrEqual(0)
    expect(note.criticalityScore).toBeLessThanOrEqual(1)
  })

  it('has a valid ISO generatedAt date', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    expect(() => new Date(note.generatedAt).toISOString()).not.toThrow()
  })
})
