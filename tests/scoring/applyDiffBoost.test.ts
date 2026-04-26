import { describe, it, expect } from 'bun:test'
import { applyDiffBoost } from '../../src/core/scoring/applyDiffBoost.ts'
import type { DiffFiles } from '../../src/core/git/getDiffFiles.ts'

const emptyDiff = (): DiffFiles => ({
  added: new Set(),
  modified: new Set(),
  deleted: new Set(),
})

describe('applyDiffBoost', () => {
  describe('without diff (legacy mode)', () => {
    it('returns baseScore unchanged for source files', () => {
      const r = applyDiffBoost('lib/posts.ts', 0.3, null)
      expect(r.skipped).toBe(false)
      // lib gets +0.10 type boost even without diff
      expect(r.finalScore).toBeCloseTo(0.4, 2)
    })

    it('still skips test files even without diff', () => {
      const r = applyDiffBoost('lib/posts.test.ts', 0.9, null)
      expect(r.skipped).toBe(true)
      expect(r.finalScore).toBe(Number.NEGATIVE_INFINITY)
    })
  })

  describe('with diff — added files', () => {
    it('source file added gets +0.4 + type boost', () => {
      const diff = emptyDiff()
      diff.added.add('lib/search-index.ts')
      const r = applyDiffBoost('lib/search-index.ts', 0.0, diff)
      expect(r.skipped).toBe(false)
      expect(r.edit).toBe('added')
      // 0 base + 0.40 add + 0.10 lib = 0.50
      expect(r.finalScore).toBeCloseTo(0.5, 2)
    })

    it('api-route added gets the largest boost (0.4 + 0.2)', () => {
      const diff = emptyDiff()
      diff.added.add('app/api/search/route.ts')
      const r = applyDiffBoost('app/api/search/route.ts', 0.0, diff)
      expect(r.finalScore).toBeCloseTo(0.6, 2)
    })

    it('component added gets +0.4 + 0.05', () => {
      const diff = emptyDiff()
      diff.added.add('app/components/Search.tsx')
      const r = applyDiffBoost('app/components/Search.tsx', 0.0, diff)
      expect(r.finalScore).toBeCloseTo(0.45, 2)
    })

    it('aux file (not source) gets only +0.1 add boost', () => {
      const diff = emptyDiff()
      diff.added.add('CHANGELOG.md')
      const r = applyDiffBoost('CHANGELOG.md', 0.0, diff)
      expect(r.finalScore).toBeCloseTo(0.1, 2)
    })

    it('test file added is still skipped', () => {
      const diff = emptyDiff()
      diff.added.add('lib/foo.test.ts')
      const r = applyDiffBoost('lib/foo.test.ts', 0.9, diff)
      expect(r.skipped).toBe(true)
      expect(r.finalScore).toBe(Number.NEGATIVE_INFINITY)
    })
  })

  describe('with diff — modified files', () => {
    it('modified source gets +0.15 + type boost', () => {
      const diff = emptyDiff()
      diff.modified.add('app/components/Existing.tsx')
      const r = applyDiffBoost('app/components/Existing.tsx', 0.3, diff)
      // 0.3 + 0.15 mod + 0.05 component = 0.5
      expect(r.finalScore).toBeCloseTo(0.5, 2)
      expect(r.edit).toBe('modified')
    })

    it('modified gets a smaller boost than added', () => {
      const diff = emptyDiff()
      diff.added.add('a.ts')
      diff.modified.add('b.ts')
      const a = applyDiffBoost('a.ts', 0.0, diff)
      const b = applyDiffBoost('b.ts', 0.0, diff)
      expect(a.finalScore).toBeGreaterThan(b.finalScore)
    })
  })

  describe('with diff — unchanged files', () => {
    it('unchanged source gets only type boost (no edit boost)', () => {
      const diff = emptyDiff()
      const r = applyDiffBoost('lib/old.ts', 0.3, diff)
      expect(r.edit).toBe('unchanged')
      expect(r.finalScore).toBeCloseTo(0.4, 2) // 0.3 + 0.1 lib
    })
  })

  describe('boost field surfaces the applied delta', () => {
    it('boost = diff_boost + type_boost', () => {
      const diff = emptyDiff()
      diff.added.add('app/api/search/route.ts')
      const r = applyDiffBoost('app/api/search/route.ts', 0.0, diff)
      expect(r.boost).toBeCloseTo(0.6, 2)
    })
  })
})
