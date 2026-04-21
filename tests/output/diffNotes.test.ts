import { describe, it, expect } from 'bun:test'
import { diffNotes, renderDiff } from '../../src/core/output/diffNotes.ts'
import type { AiFileNote } from '../../src/core/types/ai-note.ts'

function makeNote(overrides: Partial<AiFileNote> = {}): AiFileNote {
  const emptyField = { observed: [], inferred: [], confidence: 0.5, evidence: [] }
  return {
    schemaVersion: '1.0.0',
    filePath: '/project/src/example.ts',
    purpose: { ...emptyField },
    invariants: { ...emptyField },
    sensitiveDependencies: { ...emptyField },
    importantDecisions: { ...emptyField },
    knownPitfalls: { ...emptyField },
    impactValidation: { ...emptyField },
    recentChanges: [],
    criticalityScore: 0.5,
    debugSignals: {
      reverseDepCount: 0,
      directDepCount: 0,
      hasHooks: false,
      hasExternalImports: false,
      hasEnvVars: false,
      hasApiCalls: false,
      hasTodoComments: false,
      hasTests: false,
      coveragePct: null,
      churnScore: 0,
      authorCount: 0,
      coChangedFiles: [],
    },
    generatedAt: '2026-01-01T00:00:00.000Z',
    model: 'static',
    ...overrides,
  }
}

describe('diffNotes', () => {
  it('detects added observed items', () => {
    const oldNote = makeNote({
      purpose: { observed: ['renders list'], inferred: [], confidence: 0.5, evidence: [] },
    })
    const newNote = makeNote({
      purpose: { observed: ['renders list', 'handles pagination'], inferred: [], confidence: 0.5, evidence: [] },
    })

    const diff = diffNotes(oldNote, newNote)
    expect(diff.fields.purpose?.added).toEqual(['handles pagination'])
    expect(diff.fields.purpose?.removed).toEqual([])
  })

  it('detects removed observed items', () => {
    const oldNote = makeNote({
      invariants: { observed: ['must be authenticated', 'read-only mode'], inferred: [], confidence: 0.5, evidence: [] },
    })
    const newNote = makeNote({
      invariants: { observed: ['must be authenticated'], inferred: [], confidence: 0.5, evidence: [] },
    })

    const diff = diffNotes(oldNote, newNote)
    expect(diff.fields.invariants?.removed).toEqual(['read-only mode'])
    expect(diff.fields.invariants?.added).toEqual([])
  })

  it('detects added inferred items', () => {
    const oldNote = makeNote({
      knownPitfalls: { observed: [], inferred: [], confidence: 0.5, evidence: [] },
    })
    const newNote = makeNote({
      knownPitfalls: { observed: [], inferred: ['can cause N+1 queries'], confidence: 0.7, evidence: [] },
    })

    const diff = diffNotes(oldNote, newNote)
    expect(diff.fields.knownPitfalls?.added).toEqual(['can cause N+1 queries'])
    expect(diff.fields.knownPitfalls?.removed).toEqual([])
  })

  it('produces empty fields for unchanged notes', () => {
    const note = makeNote({
      purpose: { observed: ['does X', 'does Y'], inferred: ['inferred Z'], confidence: 0.8, evidence: [] },
    })

    const diff = diffNotes(note, note)
    expect(diff.fields).toEqual({})
    expect(diff.criticalityScoreDelta).toBe(0)
  })

  it('computes criticalityScoreDelta correctly', () => {
    const oldNote = makeNote({ criticalityScore: 0.3 })
    const newNote = makeNote({ criticalityScore: 0.7 })

    const diff = diffNotes(oldNote, newNote)
    expect(diff.criticalityScoreDelta).toBeCloseTo(0.4)
  })

  it('handles both added and removed items in same field', () => {
    const oldNote = makeNote({
      importantDecisions: { observed: ['uses Redux', 'server-side rendering'], inferred: [], confidence: 0.5, evidence: [] },
    })
    const newNote = makeNote({
      importantDecisions: { observed: ['uses Zustand', 'server-side rendering'], inferred: [], confidence: 0.5, evidence: [] },
    })

    const diff = diffNotes(oldNote, newNote)
    expect(diff.fields.importantDecisions?.added).toEqual(['uses Zustand'])
    expect(diff.fields.importantDecisions?.removed).toEqual(['uses Redux'])
  })

  it('does not include fields with no changes', () => {
    const sharedField = { observed: ['item A'], inferred: [], confidence: 0.5, evidence: [] }
    const oldNote = makeNote({ purpose: sharedField })
    const newNote = makeNote({ purpose: sharedField })

    const diff = diffNotes(oldNote, newNote)
    expect('purpose' in diff.fields).toBe(false)
  })
})

describe('renderDiff', () => {
  it('returns "No changes detected." when diffs array is empty', () => {
    expect(renderDiff([])).toBe('No changes detected.')
  })

  it('includes file path in output', () => {
    const note = makeNote({ filePath: '/project/src/example.ts' })
    const diff = diffNotes(
      makeNote({ purpose: { observed: ['old purpose'], inferred: [], confidence: 0.5, evidence: [] } }),
      makeNote({ purpose: { observed: ['new purpose'], inferred: [], confidence: 0.5, evidence: [] } }),
    )
    const output = renderDiff([diff])
    expect(output).toContain('/project/src/example.ts')
  })

  it('shows added items with + prefix', () => {
    const diff = diffNotes(
      makeNote({ purpose: { observed: [], inferred: [], confidence: 0.5, evidence: [] } }),
      makeNote({ purpose: { observed: ['new item'], inferred: [], confidence: 0.5, evidence: [] } }),
    )
    const output = renderDiff([diff])
    expect(output).toContain('+ new item')
  })

  it('shows removed items with - prefix', () => {
    const diff = diffNotes(
      makeNote({ purpose: { observed: ['old item'], inferred: [], confidence: 0.5, evidence: [] } }),
      makeNote({ purpose: { observed: [], inferred: [], confidence: 0.5, evidence: [] } }),
    )
    const output = renderDiff([diff])
    expect(output).toContain('- old item')
  })

  it('shows criticality score delta when >= 0.01', () => {
    const oldNote = makeNote({ criticalityScore: 0.2 })
    const newNote = makeNote({ criticalityScore: 0.8 })
    // Need at least one field change for diff to be included — use a changed field
    const diff = diffNotes(
      { ...oldNote, purpose: { observed: ['a'], inferred: [], confidence: 0.5, evidence: [] } },
      { ...newNote, purpose: { observed: ['b'], inferred: [], confidence: 0.5, evidence: [] } },
    )
    const output = renderDiff([diff])
    expect(output).toContain('score: +0.60')
  })

  it('does not show score delta when change is < 0.01', () => {
    const oldNote = makeNote({ criticalityScore: 0.5 })
    const newNote = makeNote({ criticalityScore: 0.505 })
    const diff = diffNotes(
      { ...oldNote, purpose: { observed: ['a'], inferred: [], confidence: 0.5, evidence: [] } },
      { ...newNote, purpose: { observed: ['b'], inferred: [], confidence: 0.5, evidence: [] } },
    )
    const output = renderDiff([diff])
    expect(output).not.toContain('score:')
  })

  it('shows field name before its changes', () => {
    const diff = diffNotes(
      makeNote({ knownPitfalls: { observed: ['old pitfall'], inferred: [], confidence: 0.5, evidence: [] } }),
      makeNote({ knownPitfalls: { observed: ['new pitfall'], inferred: [], confidence: 0.5, evidence: [] } }),
    )
    const output = renderDiff([diff])
    expect(output).toContain('knownPitfalls:')
  })
})
