import { describe, it, expect } from 'bun:test'
import { pickQuotaForcedFiles, DEFAULT_NEW_SOURCE_QUOTA } from '../../src/core/scoring/quotaSynthesis.ts'
import type { DiffFiles } from '../../src/core/git/getDiffFiles.ts'

const emptyDiff = (): DiffFiles => ({
  added: new Set(),
  modified: new Set(),
  deleted: new Set(),
})

describe('pickQuotaForcedFiles', () => {
  it('returns empty when diff is null', () => {
    const r = pickQuotaForcedFiles([{ relativePath: 'a.ts', baseScore: 1 }], null)
    expect(r.size).toBe(0)
  })

  it('returns empty when no files were added', () => {
    const diff = emptyDiff()
    diff.modified.add('a.ts')
    const r = pickQuotaForcedFiles([{ relativePath: 'a.ts', baseScore: 1 }], diff)
    expect(r.size).toBe(0)
  })

  it('forces all added source files when count <= quota', () => {
    const diff = emptyDiff()
    diff.added.add('lib/a.ts')
    diff.added.add('lib/b.ts')
    diff.added.add('lib/c.ts')
    const r = pickQuotaForcedFiles(
      [
        { relativePath: 'lib/a.ts', baseScore: 0 },
        { relativePath: 'lib/b.ts', baseScore: 0 },
        { relativePath: 'lib/c.ts', baseScore: 0 },
      ],
      diff,
      8,
    )
    expect(r.size).toBe(3)
    expect(r.has('lib/a.ts')).toBe(true)
    expect(r.has('lib/b.ts')).toBe(true)
    expect(r.has('lib/c.ts')).toBe(true)
  })

  it('caps at quota and ranks by baseScore desc', () => {
    const diff = emptyDiff()
    const candidates = []
    for (let i = 0; i < 12; i++) {
      const p = `lib/file${i}.ts`
      diff.added.add(p)
      candidates.push({ relativePath: p, baseScore: i })
    }
    const r = pickQuotaForcedFiles(candidates, diff, 5)
    expect(r.size).toBe(5)
    // top scores are file11..file7
    expect(r.has('lib/file11.ts')).toBe(true)
    expect(r.has('lib/file7.ts')).toBe(true)
    expect(r.has('lib/file6.ts')).toBe(false)
  })

  it('excludes added test files from quota', () => {
    const diff = emptyDiff()
    diff.added.add('lib/a.ts')
    diff.added.add('lib/a.test.ts')
    diff.added.add('package.json')
    const r = pickQuotaForcedFiles(
      [
        { relativePath: 'lib/a.ts', baseScore: 0 },
        { relativePath: 'lib/a.test.ts', baseScore: 0 },
        { relativePath: 'package.json', baseScore: 0 },
      ],
      diff,
      8,
    )
    expect(r.size).toBe(1)
    expect(r.has('lib/a.ts')).toBe(true)
    expect(r.has('lib/a.test.ts')).toBe(false)
    expect(r.has('package.json')).toBe(false)
  })

  it('excludes aux files (markdown) from quota', () => {
    const diff = emptyDiff()
    diff.added.add('README.md')
    diff.added.add('lib/a.ts')
    const r = pickQuotaForcedFiles(
      [
        { relativePath: 'README.md', baseScore: 0 },
        { relativePath: 'lib/a.ts', baseScore: 0 },
      ],
      diff,
      8,
    )
    expect(r.size).toBe(1)
    expect(r.has('lib/a.ts')).toBe(true)
  })

  it('quota=0 returns empty even with added files', () => {
    const diff = emptyDiff()
    diff.added.add('lib/a.ts')
    const r = pickQuotaForcedFiles([{ relativePath: 'lib/a.ts', baseScore: 0 }], diff, 0)
    expect(r.size).toBe(0)
  })

  it('default quota constant is 8', () => {
    expect(DEFAULT_NEW_SOURCE_QUOTA).toBe(8)
  })
})
