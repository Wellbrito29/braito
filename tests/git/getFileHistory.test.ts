import { describe, it, expect } from 'bun:test'
import path from 'node:path'
import { getFileHistory } from '../../src/core/git/getFileHistory.ts'

const repoRoot = path.resolve(import.meta.dir, '../..')

describe('getFileHistory', () => {
  it('returns empty history for a non-existent file', () => {
    const result = getFileHistory('/tmp/ghost.ts', repoRoot)
    expect(result.churnScore).toBe(0)
    expect(result.recentCommitMessages).toHaveLength(0)
    expect(result.authorCount).toBe(0)
  })

  it('returns history for a tracked file', () => {
    const filePath = path.resolve(repoRoot, 'src/core/types/ai-note.ts')
    const result = getFileHistory(filePath, repoRoot)
    expect(result.churnScore).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(result.recentCommitMessages)).toBe(true)
    expect(result.recentCommitMessages.length).toBeLessThanOrEqual(10)
  })
})
