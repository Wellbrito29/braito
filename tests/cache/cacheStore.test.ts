import { describe, it, expect, afterEach } from 'bun:test'
import path from 'node:path'
import fs from 'node:fs/promises'
import { loadCache, saveCache } from '../../src/core/cache/cacheStore.ts'
import { computeHash } from '../../src/core/cache/computeHash.ts'
import { isCacheValid } from '../../src/core/cache/isCacheValid.ts'

const TMP_ROOT = path.resolve(import.meta.dir, '../../.tmp-test-cache')

afterEach(async () => {
  await fs.rm(TMP_ROOT, { recursive: true, force: true })
})

describe('loadCache', () => {
  it('returns empty map when no cache file exists', async () => {
    const store = await loadCache(TMP_ROOT)
    expect(store.size).toBe(0)
  })
})

describe('saveCache / loadCache round-trip', () => {
  it('persists and restores hash store', async () => {
    const store = new Map([
      ['src/foo.ts', 'abc123'],
      ['src/bar.ts', 'def456'],
    ])
    await saveCache(TMP_ROOT, store)
    const loaded = await loadCache(TMP_ROOT)
    expect(loaded.get('src/foo.ts')).toBe('abc123')
    expect(loaded.get('src/bar.ts')).toBe('def456')
  })
})

describe('computeHash', () => {
  it('returns a hex string for a real file', async () => {
    const filePath = path.resolve(import.meta.dir, '../../src/core/types/ai-note.ts')
    const hash = await computeHash(filePath)
    expect(typeof hash).toBe('string')
    expect(hash.length).toBe(40) // SHA-1 = 40 hex chars
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true)
  })

  it('produces the same hash for unchanged file', async () => {
    const filePath = path.resolve(import.meta.dir, '../../src/core/types/ai-note.ts')
    const h1 = await computeHash(filePath)
    const h2 = await computeHash(filePath)
    expect(h1).toBe(h2)
  })
})

describe('isCacheValid', () => {
  it('returns false when file not in cache', async () => {
    const store = new Map<string, string>()
    const filePath = path.resolve(import.meta.dir, '../../src/core/types/ai-note.ts')
    const valid = await isCacheValid(filePath, 'src/core/types/ai-note.ts', store)
    expect(valid).toBe(false)
  })

  it('returns true when hash matches', async () => {
    const filePath = path.resolve(import.meta.dir, '../../src/core/types/ai-note.ts')
    const hash = await computeHash(filePath)
    const store = new Map([['src/core/types/ai-note.ts', hash]])
    const valid = await isCacheValid(filePath, 'src/core/types/ai-note.ts', store)
    expect(valid).toBe(true)
  })

  it('returns false when hash differs', async () => {
    const filePath = path.resolve(import.meta.dir, '../../src/core/types/ai-note.ts')
    const store = new Map([['src/core/types/ai-note.ts', 'outdatedhash']])
    const valid = await isCacheValid(filePath, 'src/core/types/ai-note.ts', store)
    expect(valid).toBe(false)
  })
})
