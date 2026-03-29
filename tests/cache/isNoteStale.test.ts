import { describe, it, expect } from 'bun:test'
import { isNoteStale } from '../../src/core/cache/isNoteStale.ts'

describe('isNoteStale', () => {
  it('returns false for a note generated now', () => {
    expect(isNoteStale(new Date().toISOString(), 30)).toBe(false)
  })

  it('returns true for a note older than the threshold', () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    expect(isNoteStale(old, 30)).toBe(true)
  })

  it('returns false for a note exactly at the threshold boundary', () => {
    const boundary = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
    expect(isNoteStale(boundary, 30)).toBe(false)
  })

  it('respects custom threshold', () => {
    const threeDaysOld = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(isNoteStale(threeDaysOld, 7)).toBe(false)
    expect(isNoteStale(threeDaysOld, 2)).toBe(true)
  })
})
