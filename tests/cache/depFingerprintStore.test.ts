import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {
  loadFingerprints,
  saveFingerprints,
  areDepsStale,
  buildFingerprint,
} from '../../src/core/cache/depFingerprintStore.ts'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'braito-fp-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('loadFingerprints', () => {
  it('returns an empty map when the file is missing', async () => {
    const store = await loadFingerprints(tmpDir)
    expect(store.size).toBe(0)
  })

  it('round-trips via saveFingerprints', async () => {
    const store = new Map<string, Record<string, string>>()
    store.set('src/a.ts', { 'src/b.ts': 'hb', 'src/c.ts': 'hc' })
    store.set('src/b.ts', { 'src/c.ts': 'hc' })
    await saveFingerprints(tmpDir, store)
    const loaded = await loadFingerprints(tmpDir)
    expect(loaded.size).toBe(2)
    expect(loaded.get('src/a.ts')).toEqual({ 'src/b.ts': 'hb', 'src/c.ts': 'hc' })
    expect(loaded.get('src/b.ts')).toEqual({ 'src/c.ts': 'hc' })
  })

  it('writes the file sorted by key for deterministic output', async () => {
    const store = new Map<string, Record<string, string>>()
    store.set('z.ts', { 'x.ts': '1' })
    store.set('a.ts', { 'b.ts': '2' })
    store.set('m.ts', { 'n.ts': '3' })
    await saveFingerprints(tmpDir, store)
    const raw = await fs.readFile(path.join(tmpDir, 'cache/dep-fingerprints.json'), 'utf-8')
    const keysInOrder = Array.from(raw.matchAll(/"([^"]+\.ts)":/g)).map((m) => m[1])
    // Top-level file keys should be sorted: a, b (inner), m, n (inner), z, x (inner)
    expect(keysInOrder.indexOf('a.ts')).toBeLessThan(keysInOrder.indexOf('m.ts'))
    expect(keysInOrder.indexOf('m.ts')).toBeLessThan(keysInOrder.indexOf('z.ts'))
  })
})

describe('areDepsStale', () => {
  it('returns false when stored fingerprint is missing (graceful migration)', () => {
    expect(areDepsStale({ 'b.ts': 'h1' }, undefined)).toBe(false)
  })

  it('returns false when all dep hashes match', () => {
    const stored = { 'b.ts': 'h1', 'c.ts': 'h2' }
    const current = { 'b.ts': 'h1', 'c.ts': 'h2' }
    expect(areDepsStale(current, stored)).toBe(false)
  })

  it('returns true when a dep hash changed', () => {
    const stored = { 'b.ts': 'h1', 'c.ts': 'h2' }
    const current = { 'b.ts': 'h1', 'c.ts': 'h2-new' }
    expect(areDepsStale(current, stored)).toBe(true)
  })

  it('returns true when a new dep appeared', () => {
    const stored = { 'b.ts': 'h1' }
    const current = { 'b.ts': 'h1', 'c.ts': 'h2' }
    expect(areDepsStale(current, stored)).toBe(true)
  })

  it('returns true when a dep vanished', () => {
    const stored = { 'b.ts': 'h1', 'c.ts': 'h2' }
    const current = { 'b.ts': 'h1' }
    expect(areDepsStale(current, stored)).toBe(true)
  })

  it('returns false for an empty stored and empty current', () => {
    expect(areDepsStale({}, {})).toBe(false)
  })
})

describe('buildFingerprint', () => {
  it('captures hashes for deps present in the hash map', () => {
    const hashes = new Map([
      ['src/b.ts', 'hb'],
      ['src/c.ts', 'hc'],
    ])
    const fp = buildFingerprint(['src/b.ts', 'src/c.ts'], hashes)
    expect(fp).toEqual({ 'src/b.ts': 'hb', 'src/c.ts': 'hc' })
  })

  it('skips deps not present in the hash map (external imports)', () => {
    const hashes = new Map([['src/b.ts', 'hb']])
    const fp = buildFingerprint(['src/b.ts', 'node_modules/zod'], hashes)
    expect(fp).toEqual({ 'src/b.ts': 'hb' })
  })

  it('returns empty for a leaf file with no deps', () => {
    const hashes = new Map([['src/a.ts', 'ha']])
    expect(buildFingerprint([], hashes)).toEqual({})
  })
})
