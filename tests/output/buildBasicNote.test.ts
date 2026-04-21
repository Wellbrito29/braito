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
    exportDetails: [{ name: 'useSearch', signature: 'useSearch(query: string): SearchResult', kind: 'function' }],
    symbols: ['useSearch'],
    hooks: ['useSearch'],
    envVars: [],
    apiCalls: [],
    comments: { todo: [], fixme: [], hack: [], invariant: [], decision: [] },
    hasSideEffects: false,
    signatures: [],
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
  recentCommits: [],
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
    const analysis = makeAnalysis({
      comments: { todo: ['TODO: fix this'], fixme: [], hack: [], invariant: [], decision: [] },
    })
    const note = buildBasicNote(analysis, graph, tests, emptyGit)
    expect(note.knownPitfalls.observed).toContain('TODO: fix this')
  })

  it('adds risky commit messages as knownPitfalls evidence (not observed bullets)', () => {
    const git: GitSignals = {
      ...emptyGit,
      recentCommitMessages: ['hotfix: revert search pagination', 'chore: update deps'],
    }
    const note = buildBasicNote(makeAnalysis(), graph, tests, git)
    expect(note.knownPitfalls.evidence.some((e) => e.type === 'git' && e.detail.includes('hotfix'))).toBe(true)
    expect(note.knownPitfalls.observed.some((o) => o.includes('hotfix'))).toBe(false)
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

  it('criticalityScore rewards high co-change-to-churn ratio on low-activity files', () => {
    // 3 co-changes out of 4 total commits = 0.75 ratio → should trigger +0.15
    const tightCoupling: GitSignals = {
      ...emptyGit,
      churnScore: 4,
      coChangedFiles: [{ path: '/project/src/b.ts', count: 3 }],
    }
    const looseCoupling: GitSignals = {
      ...emptyGit,
      churnScore: 4,
      coChangedFiles: [{ path: '/project/src/b.ts', count: 1 }],
    }
    const tight = buildBasicNote(makeAnalysis(), graph, tests, tightCoupling)
    const loose = buildBasicNote(makeAnalysis(), graph, tests, looseCoupling)
    expect(tight.criticalityScore).toBeGreaterThan(loose.criticalityScore)
  })

  it('criticalityScore ignores co-change when ratio is low even on high-churn files', () => {
    // 5 co-changes out of 50 total commits = 0.1 ratio → should NOT trigger bonus
    const dilutedCoupling: GitSignals = {
      ...emptyGit,
      churnScore: 50,
      coChangedFiles: [{ path: '/project/src/b.ts', count: 5 }],
    }
    const baseline: GitSignals = { ...emptyGit, churnScore: 50 }
    const diluted = buildBasicNote(makeAnalysis(), graph, tests, dilutedCoupling)
    const base = buildBasicNote(makeAnalysis(), graph, tests, baseline)
    expect(diluted.criticalityScore).toBe(base.criticalityScore)
  })

  it('criticalityScore requires minimum absolute co-change count to avoid noise', () => {
    // 1 co-change out of 1 commit = 1.0 ratio but only 1 absolute → should NOT trigger
    const singleCoChange: GitSignals = {
      ...emptyGit,
      churnScore: 1,
      coChangedFiles: [{ path: '/project/src/b.ts', count: 1 }],
    }
    const baseline: GitSignals = { ...emptyGit, churnScore: 1 }
    const single = buildBasicNote(makeAnalysis(), graph, tests, singleCoChange)
    const base = buildBasicNote(makeAnalysis(), graph, tests, baseline)
    expect(single.criticalityScore).toBe(base.criticalityScore)
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

  // invariants heuristics
  it('captures INVARIANT comments in invariants.observed', () => {
    const analysis = makeAnalysis({
      comments: { todo: [], fixme: [], hack: [], invariant: ['INVARIANT: must be sorted'], decision: [] },
    })
    const note = buildBasicNote(analysis, graph, tests, emptyGit)
    expect(note.invariants.observed).toContain('INVARIANT: must be sorted')
    expect(note.invariants.evidence.some((e) => e.type === 'comment')).toBe(true)
  })

  it('detects validation library import as invariant', () => {
    const analysis = makeAnalysis({ externalImports: ['zod'] })
    const note = buildBasicNote(analysis, graph, tests, emptyGit)
    expect(note.invariants.observed.some((o) => o.includes('zod'))).toBe(true)
  })

  it('adds required env vars to invariants', () => {
    const analysis = makeAnalysis({ envVars: ['API_KEY', 'BASE_URL'] })
    const note = buildBasicNote(analysis, graph, tests, emptyGit)
    expect(note.invariants.observed.some((o) => o.includes('API_KEY'))).toBe(true)
  })

  it('adds hooks rule to invariants when hooks are present', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    expect(note.invariants.observed.some((o) => o.includes('hooks rules'))).toBe(true)
  })

  // importantDecisions heuristics
  it('captures DECISION comments in importantDecisions.observed', () => {
    const analysis = makeAnalysis({
      comments: {
        todo: [], fixme: [], hack: [], invariant: [],
        decision: ['NOTE: chose zod instead of yup for better TS inference'],
      },
    })
    const note = buildBasicNote(analysis, graph, tests, emptyGit)
    expect(note.importantDecisions.observed.some((o) => o.includes('chose zod'))).toBe(true)
    expect(note.importantDecisions.evidence.some((e) => e.type === 'comment')).toBe(true)
  })

  it('captures decision-flavoured commit messages in importantDecisions', () => {
    const git: GitSignals = {
      ...emptyGit,
      recentCommitMessages: ['switched from axios to fetch because of bundle size', 'fix: typo'],
    }
    const note = buildBasicNote(makeAnalysis(), graph, tests, git)
    expect(note.importantDecisions.observed.some((o) => o.includes('switched'))).toBe(true)
    expect(note.importantDecisions.evidence.some((e) => e.type === 'git')).toBe(true)
  })

  it('matches conventional-commit refactor/revert/perf prefixes regardless of language', () => {
    const git: GitSignals = {
      ...emptyGit,
      recentCommitMessages: [
        'refactor(persistence): split base repository',
        'revert: bring back sync path',
        'perf: cache resolved imports',
        'chore: bump deps',
      ],
    }
    const note = buildBasicNote(makeAnalysis(), graph, tests, git, undefined, undefined, undefined, undefined, 'pt-BR')
    expect(note.importantDecisions.observed.some((o) => o.includes('refactor('))).toBe(true)
    expect(note.importantDecisions.observed.some((o) => o.includes('revert'))).toBe(true)
    expect(note.importantDecisions.observed.some((o) => o.includes('perf'))).toBe(true)
    expect(note.importantDecisions.observed.some((o) => o.includes('chore'))).toBe(false)
  })

  it('uses Portuguese keywords when language is pt-BR', () => {
    const git: GitSignals = {
      ...emptyGit,
      recentCommitMessages: [
        'escolhemos fetch em vez de axios pelo tamanho do bundle',
        'refatoração da camada de persistência',
      ],
    }
    const note = buildBasicNote(makeAnalysis(), graph, tests, git, undefined, undefined, undefined, undefined, 'pt-BR')
    expect(note.importantDecisions.observed.some((o) => o.includes('escolhemos'))).toBe(true)
    expect(note.importantDecisions.observed.some((o) => o.includes('refatoração'))).toBe(true)
  })

  it('falls back to base language tag (pt from pt-PT) and then to English', () => {
    const git: GitSignals = {
      ...emptyGit,
      recentCommitMessages: ['substituiu o cliente HTTP legado'],
    }
    const ptPT = buildBasicNote(makeAnalysis(), graph, tests, git, undefined, undefined, undefined, undefined, 'pt-PT')
    expect(ptPT.importantDecisions.observed.some((o) => o.includes('substituiu'))).toBe(true)

    const unknownLang = buildBasicNote(makeAnalysis(), graph, tests, {
      ...emptyGit,
      recentCommitMessages: ['chose fetch instead of axios'],
    }, undefined, undefined, undefined, undefined, 'xx-YY')
    expect(unknownLang.importantDecisions.observed.some((o) => o.includes('chose'))).toBe(true)
  })

  // coverage hints
  it('surfaces coverage percentage in impactValidation when provided', () => {
    const testsWithCoverage: TestSignals = { ...tests, coveragePct: 0.85 }
    const note = buildBasicNote(makeAnalysis(), graph, testsWithCoverage, emptyGit)
    expect(note.impactValidation.observed.some((o) => o.includes('85.0%'))).toBe(true)
    expect(note.impactValidation.evidence.some((e) => e.type === 'test' && e.detail.includes('Coverage'))).toBe(true)
  })

  it('flags low coverage with a risk warning', () => {
    const testsWithLowCoverage: TestSignals = { ...tests, coveragePct: 0.3 }
    const note = buildBasicNote(makeAnalysis(), graph, testsWithLowCoverage, emptyGit)
    expect(note.impactValidation.observed.some((o) => o.includes('Low line coverage'))).toBe(true)
  })

  it('does not add coverage to impactValidation when not provided', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    expect(note.impactValidation.observed.every((o) => !o.includes('coverage'))).toBe(true)
  })

  it('populates recentChanges from git commits', () => {
    const git: GitSignals = {
      ...emptyGit,
      recentCommits: [
        { hash: 'abc1234def5678', date: '2026-03-01T12:00:00Z', message: 'fix: correct null check', author: 'Dev' },
        { hash: 'bcd2345ef6789a', date: '2026-02-15T09:30:00Z', message: 'feat: add retry logic', author: 'Dev' },
      ],
    }
    const note = buildBasicNote(makeAnalysis(), graph, tests, git)
    expect(note.recentChanges).toHaveLength(2)
    expect(note.recentChanges[0].message).toBe('fix: correct null check')
    expect(note.recentChanges[0].hash).toBe('abc1234def5678')
    expect(note.recentChanges[1].message).toBe('feat: add retry logic')
  })

  it('recentChanges is empty when there are no commits', () => {
    const note = buildBasicNote(makeAnalysis(), graph, tests, emptyGit)
    expect(note.recentChanges).toHaveLength(0)
  })
})
