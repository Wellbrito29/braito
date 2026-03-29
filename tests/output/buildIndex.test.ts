import { describe, it, expect, afterEach } from 'bun:test'
import path from 'node:path'
import fs from 'node:fs/promises'
import { buildIndex } from '../../src/core/output/buildIndex.ts'
import { writeIndexNote } from '../../src/core/output/writeIndexNote.ts'
import type { AiFileNote } from '../../src/core/types/ai-note.ts'

const TMP_OUTPUT = path.resolve(import.meta.dir, '../../.tmp-test-index')
const ROOT = '/project'

afterEach(async () => {
  await fs.rm(TMP_OUTPUT, { recursive: true, force: true })
})

function makeNote(filePath: string, score: number, model = 'static'): AiFileNote {
  const empty = { observed: [], inferred: [], confidence: 0, evidence: [] }
  return {
    schemaVersion: '1.0.0',
    filePath,
    purpose: { observed: ['Does something'], inferred: [], confidence: 0.6, evidence: [] },
    invariants: empty,
    sensitiveDependencies: empty,
    importantDecisions: empty,
    knownPitfalls: empty,
    impactValidation: empty,
    criticalityScore: score,
    generatedAt: new Date().toISOString(),
    model,
  }
}

describe('buildIndex', () => {
  it('sorts entries by criticalityScore descending', () => {
    const notes = [
      makeNote('/project/src/a.ts', 0.3),
      makeNote('/project/src/b.ts', 0.8),
      makeNote('/project/src/c.ts', 0.5),
    ]
    const index = buildIndex(notes, ROOT)
    expect(index.entries[0].criticalityScore).toBe(0.8)
    expect(index.entries[1].criticalityScore).toBe(0.5)
    expect(index.entries[2].criticalityScore).toBe(0.3)
  })

  it('counts synthesized files correctly', () => {
    const notes = [
      makeNote('/project/src/a.ts', 0.3, 'static'),
      makeNote('/project/src/b.ts', 0.8, 'llama3'),
      makeNote('/project/src/c.ts', 0.5, 'claude-sonnet-4-6'),
    ]
    const index = buildIndex(notes, ROOT)
    expect(index.synthesizedFiles).toBe(2)
    expect(index.totalFiles).toBe(3)
  })

  it('sets relativePath relative to root', () => {
    const notes = [makeNote('/project/src/utils/helper.ts', 0.4)]
    const index = buildIndex(notes, ROOT)
    expect(index.entries[0].relativePath).toBe('src/utils/helper.ts')
  })

  it('derives domain as first directory segment', () => {
    const notes = [makeNote('/project/src/core/graph/buildDependencyGraph.ts', 0.5)]
    const index = buildIndex(notes, ROOT)
    expect(index.entries[0].domain).toBe('src')
  })

  it('derives domain as two segments for monorepo roots', () => {
    const notes = [makeNote('/project/packages/search/src/useSearch.ts', 0.5)]
    const index = buildIndex(notes, ROOT)
    expect(index.entries[0].domain).toBe('packages/search')
  })

  it('derives domain as "." for root-level files', () => {
    const notes = [makeNote('/project/index.ts', 0.2)]
    const index = buildIndex(notes, ROOT)
    expect(index.entries[0].domain).toBe('.')
  })

  it('marks fresh notes as not stale', () => {
    const notes = [makeNote('/project/src/a.ts', 0.5)]
    const index = buildIndex(notes, ROOT, 30)
    expect(index.entries[0].stale).toBe(false)
    expect(index.staleFiles).toBe(0)
  })

  it('marks old notes as stale', () => {
    const empty = { observed: [], inferred: [], confidence: 0, evidence: [] }
    const oldNote: AiFileNote = {
      schemaVersion: '1.0.0',
      filePath: '/project/src/a.ts',
      purpose: { observed: ['Does something'], inferred: [], confidence: 0.6, evidence: [] },
      invariants: empty, sensitiveDependencies: empty, importantDecisions: empty,
      knownPitfalls: empty, impactValidation: empty,
      criticalityScore: 0.5,
      generatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      model: 'static',
    }
    const index = buildIndex([oldNote], ROOT, 30)
    expect(index.entries[0].stale).toBe(true)
    expect(index.staleFiles).toBe(1)
  })
})

describe('writeIndexNote', () => {
  it('creates index.json and index.md', async () => {
    const notes = [makeNote('/project/src/a.ts', 0.7)]
    const index = buildIndex(notes, ROOT)
    await writeIndexNote(index, ROOT, TMP_OUTPUT)

    const jsonExists = await fs.access(path.join(TMP_OUTPUT, 'index.json')).then(() => true).catch(() => false)
    const mdExists = await fs.access(path.join(TMP_OUTPUT, 'index.md')).then(() => true).catch(() => false)
    expect(jsonExists).toBe(true)
    expect(mdExists).toBe(true)
  })

  it('index.md contains the file entry', async () => {
    const notes = [makeNote('/project/src/a.ts', 0.7)]
    const index = buildIndex(notes, ROOT)
    await writeIndexNote(index, ROOT, TMP_OUTPUT)
    const content = await fs.readFile(path.join(TMP_OUTPUT, 'index.md'), 'utf-8')
    expect(content).toContain('src/a.ts')
    expect(content).toContain('0.70')
  })

  it('index.md groups files by domain with section headers', async () => {
    const notes = [
      makeNote('/project/src/core/a.ts', 0.8),
      makeNote('/project/src/cli/b.ts', 0.5),
      makeNote('/project/tests/c.ts', 0.3),
    ]
    const index = buildIndex(notes, ROOT)
    await writeIndexNote(index, ROOT, TMP_OUTPUT)
    const content = await fs.readFile(path.join(TMP_OUTPUT, 'index.md'), 'utf-8')
    expect(content).toContain('## src')
    expect(content).toContain('## tests')
  })

  it('index.md groups monorepo packages under packages/<name>', async () => {
    const notes = [
      makeNote('/project/packages/search/src/a.ts', 0.7),
      makeNote('/project/packages/auth/src/b.ts', 0.4),
    ]
    const index = buildIndex(notes, ROOT)
    await writeIndexNote(index, ROOT, TMP_OUTPUT)
    const content = await fs.readFile(path.join(TMP_OUTPUT, 'index.md'), 'utf-8')
    expect(content).toContain('## packages/search')
    expect(content).toContain('## packages/auth')
  })
})
