import { describe, it, expect } from 'bun:test'
import path from 'node:path'
import { getGitSignals } from '../../src/core/git/getGitSignals.ts'

const repoRoot = path.resolve(import.meta.dir, '../..')
const sampleFile = path.resolve(repoRoot, 'src/core/output/buildBasicNote.ts')

describe('getGitSignals', () => {
  it('returns empty signals for a non-git directory', () => {
    const result = getGitSignals('/tmp/not-a-git-repo/file.ts', '/tmp/not-a-git-repo')
    expect(result.churnScore).toBe(0)
    expect(result.recentCommitMessages).toHaveLength(0)
    expect(result.recentCommits).toHaveLength(0)
    expect(result.coChangedFiles).toHaveLength(0)
    expect(result.authorCount).toBe(0)
  })

  it('returns GitSignals shape for a real file in the repo', () => {
    const result = getGitSignals(sampleFile, repoRoot)
    expect(typeof result.churnScore).toBe('number')
    expect(Array.isArray(result.recentCommitMessages)).toBe(true)
    expect(Array.isArray(result.recentCommits)).toBe(true)
    expect(Array.isArray(result.coChangedFiles)).toBe(true)
    expect(typeof result.authorCount).toBe('number')
    expect(result.filePath).toBe(sampleFile)
  })

  it('coChangedFiles entries have path and count', () => {
    const result = getGitSignals(sampleFile, repoRoot)
    for (const entry of result.coChangedFiles) {
      expect(typeof entry.path).toBe('string')
      expect(typeof entry.count).toBe('number')
      expect(entry.count).toBeGreaterThan(0)
    }
  })
})
