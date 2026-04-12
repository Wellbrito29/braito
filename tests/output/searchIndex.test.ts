import { describe, it, expect } from 'bun:test'
import { buildSearchIndex, loadSearchIndex, noteToSearchableDoc, createMiniSearchInstance } from '../../src/core/output/buildSearchIndex.ts'
import type { AiFileNote } from '../../src/core/types/ai-note.ts'

function makeNote(overrides: Partial<AiFileNote> = {}): AiFileNote {
  const empty = { observed: [], inferred: [], confidence: 0, evidence: [] }
  return {
    schemaVersion: '1.0.0',
    filePath: '/project/src/foo.ts',
    purpose: { observed: ['Exports the authentication middleware'], inferred: ['Handles JWT token validation'], confidence: 0.8, evidence: [{ type: 'code', detail: 'import jwt from jsonwebtoken' }] },
    invariants: { observed: ['Token must be present in Authorization header'], inferred: [], confidence: 0.7, evidence: [] },
    sensitiveDependencies: empty,
    importantDecisions: { observed: ['Chose RS256 over HS256 for token signing'], inferred: [], confidence: 0.6, evidence: [{ type: 'comment', detail: 'NOTE: RS256 chosen for key rotation support' }] },
    knownPitfalls: { observed: ['Token expiry not checked on refresh endpoint'], inferred: [], confidence: 0.5, evidence: [] },
    impactValidation: empty,
    recentChanges: [],
    criticalityScore: 0.72,
    debugSignals: {
      reverseDepCount: 3, directDepCount: 2, hasHooks: false, hasExternalImports: true,
      hasEnvVars: false, hasApiCalls: false, hasTodoComments: false, hasTests: true,
      coveragePct: 85, churnScore: 5, authorCount: 2, coChangedFiles: [],
    },
    generatedAt: new Date().toISOString(),
    model: 'static',
    ...overrides,
  }
}

describe('buildSearchIndex', () => {
  it('creates a serializable index from notes', () => {
    const notes = new Map<string, AiFileNote>()
    notes.set('src/auth.ts', makeNote())
    notes.set('src/db.ts', makeNote({
      filePath: '/project/src/db.ts',
      purpose: { observed: ['Database connection pool manager'], inferred: [], confidence: 0.8, evidence: [] },
    }))

    const json = buildSearchIndex(notes)
    expect(typeof json).toBe('string')
    expect(json.length).toBeGreaterThan(0)

    // Should be valid JSON
    const parsed = JSON.parse(json)
    expect(parsed).toBeDefined()
  })

  it('index can be deserialized and searched', () => {
    const notes = new Map<string, AiFileNote>()
    notes.set('src/auth.ts', makeNote())
    notes.set('src/db.ts', makeNote({
      filePath: '/project/src/db.ts',
      purpose: { observed: ['Database connection pool manager'], inferred: [], confidence: 0.8, evidence: [] },
    }))

    const json = buildSearchIndex(notes)
    const ms = loadSearchIndex(json)

    const results = ms.search('authentication')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe('src/auth.ts')
  })

  it('BM25 ranks relevant results higher', () => {
    const notes = new Map<string, AiFileNote>()
    notes.set('src/auth.ts', makeNote())
    notes.set('src/db.ts', makeNote({
      filePath: '/project/src/db.ts',
      purpose: { observed: ['Database connection pool manager'], inferred: [], confidence: 0.8, evidence: [] },
    }))
    notes.set('src/utils.ts', makeNote({
      filePath: '/project/src/utils.ts',
      purpose: { observed: ['Utility functions'], inferred: [], confidence: 0.5, evidence: [] },
    }))

    const json = buildSearchIndex(notes)
    const ms = loadSearchIndex(json)

    const results = ms.search('database connection')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe('src/db.ts')
  })

  it('supports fuzzy matching', () => {
    const notes = new Map<string, AiFileNote>()
    notes.set('src/auth.ts', makeNote())

    const json = buildSearchIndex(notes)
    const ms = loadSearchIndex(json)

    // "authenticaton" (typo) should still match via fuzzy
    const results = ms.search('authenticaton', { fuzzy: 0.3 })
    expect(results.length).toBeGreaterThan(0)
  })

  it('supports prefix search', () => {
    const notes = new Map<string, AiFileNote>()
    notes.set('src/auth.ts', makeNote())

    const json = buildSearchIndex(notes)
    const ms = loadSearchIndex(json)

    const results = ms.search('auth', { prefix: true })
    expect(results.length).toBeGreaterThan(0)
  })

  it('searches evidence fields', () => {
    const notes = new Map<string, AiFileNote>()
    notes.set('src/auth.ts', makeNote())

    const json = buildSearchIndex(notes)
    const ms = loadSearchIndex(json)

    // "jsonwebtoken" appears only in evidence.detail
    const results = ms.search('jsonwebtoken')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe('src/auth.ts')
  })

  it('returns empty results for unrelated queries', () => {
    const notes = new Map<string, AiFileNote>()
    notes.set('src/auth.ts', makeNote())

    const json = buildSearchIndex(notes)
    const ms = loadSearchIndex(json)

    const results = ms.search('kubernetes deployment yaml')
    expect(results).toHaveLength(0)
  })
})

describe('noteToSearchableDoc', () => {
  it('concatenates observed and inferred into text fields', () => {
    const note = makeNote()
    const doc = noteToSearchableDoc('src/auth.ts', note)

    expect(doc.id).toBe('src/auth.ts')
    expect(doc.purpose).toContain('authentication middleware')
    expect(doc.purpose).toContain('JWT token validation')
    expect(doc.invariants).toContain('Authorization header')
    expect(doc.evidence).toContain('jsonwebtoken')
  })
})
