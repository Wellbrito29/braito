import { describe, it, expect, afterEach } from 'bun:test'
import path from 'node:path'
import fs from 'node:fs/promises'
import { writeMarkdownNote } from '../../src/core/output/writeMarkdownNote.ts'
import type { AiFileNote } from '../../src/core/types/ai-note.ts'

const TMP_OUTPUT = path.resolve(import.meta.dir, '../../.tmp-test-md')

afterEach(async () => {
  await fs.rm(TMP_OUTPUT, { recursive: true, force: true })
})

function makeNote(overrides: Partial<AiFileNote> = {}): AiFileNote {
  const empty = { observed: [], inferred: [], confidence: 0, evidence: [] }
  return {
    schemaVersion: '1.0.0',
    filePath: '/project/src/useSearch.ts',
    purpose: {
      observed: ['Exports hooks: useSearch'],
      inferred: ['Orchestrates search flow'],
      confidence: 0.89,
      evidence: [{ type: 'code', detail: 'export function useSearch' }],
    },
    invariants: empty,
    sensitiveDependencies: {
      observed: ['SearchScreen.tsx'],
      inferred: [],
      confidence: 0.85,
      evidence: [{ type: 'graph', detail: 'Reverse dep: SearchScreen.tsx' }],
    },
    importantDecisions: empty,
    knownPitfalls: {
      observed: ['TODO: remove legacy fallback'],
      inferred: [],
      confidence: 0.9,
      evidence: [{ type: 'comment', detail: 'TODO: remove legacy fallback' }],
    },
    impactValidation: empty,
    recentChanges: [],
    criticalityScore: 0.72,
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
    generatedAt: '2026-03-28T00:00:00.000Z',
    model: 'llama3',
    ...overrides,
  }
}

describe('writeMarkdownNote', () => {
  it('creates a .md file at the correct path', async () => {
    const note = makeNote()
    const outputPath = await writeMarkdownNote(note, '/project', TMP_OUTPUT)
    expect(outputPath.endsWith('.md')).toBe(true)
    const exists = await fs.access(outputPath).then(() => true).catch(() => false)
    expect(exists).toBe(true)
  })

  it('includes file path and model in header', async () => {
    const note = makeNote()
    const outputPath = await writeMarkdownNote(note, '/project', TMP_OUTPUT)
    const content = await fs.readFile(outputPath, 'utf-8')
    expect(content).toContain('src/useSearch.ts')
    expect(content).toContain('llama3')
    expect(content).toContain('0.72')
  })

  it('renders observed and inferred items', async () => {
    const note = makeNote()
    const outputPath = await writeMarkdownNote(note, '/project', TMP_OUTPUT)
    const content = await fs.readFile(outputPath, 'utf-8')
    expect(content).toContain('Exports hooks: useSearch')
    expect(content).toContain('Orchestrates search flow')
  })

  it('renders evidence table', async () => {
    const note = makeNote()
    const outputPath = await writeMarkdownNote(note, '/project', TMP_OUTPUT)
    const content = await fs.readFile(outputPath, 'utf-8')
    expect(content).toContain('| code |')
    expect(content).toContain('export function useSearch')
  })

  it('skips empty sections', async () => {
    const note = makeNote()
    const outputPath = await writeMarkdownNote(note, '/project', TMP_OUTPUT)
    const content = await fs.readFile(outputPath, 'utf-8')
    expect(content).not.toContain('## Invariants')
    expect(content).not.toContain('## Important Decisions')
  })
})
