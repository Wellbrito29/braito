import { describe, it, expect } from 'bun:test'
import path from 'node:path'
import { getCoChangedFiles } from '../../src/core/git/getCoChangedFiles.ts'

const repoRoot = path.resolve(import.meta.dir, '../..')

describe('getCoChangedFiles', () => {
  it('returns empty array for a non-existent file', () => {
    const result = getCoChangedFiles('/tmp/ghost.ts', repoRoot)
    expect(result).toHaveLength(0)
  })

  it('returns co-changed files for a tracked file', () => {
    const filePath = path.resolve(repoRoot, 'src/core/types/ai-note.ts')
    const result = getCoChangedFiles(filePath, repoRoot)
    expect(Array.isArray(result)).toBe(true)
    for (const entry of result) {
      expect(typeof entry.path).toBe('string')
      expect(entry.count).toBeGreaterThan(0)
    }
  })

  it('results are sorted by count descending', () => {
    const filePath = path.resolve(repoRoot, 'src/core/types/ai-note.ts')
    const result = getCoChangedFiles(filePath, repoRoot)
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count)
    }
  })
})
