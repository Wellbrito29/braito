import { describe, it, expect } from 'bun:test'
import { detectCycles, filesInCycles } from '../../src/core/graph/detectCycles.ts'

describe('detectCycles', () => {
  it('detects a simple A → B → A cycle', () => {
    const graph = new Map([
      ['A', ['B']],
      ['B', ['A']],
    ])
    const cycles = detectCycles(graph)
    expect(cycles.length).toBeGreaterThan(0)
    const flat = cycles.flat()
    expect(flat).toContain('A')
    expect(flat).toContain('B')
  })

  it('returns no cycles for a linear A → B → C graph', () => {
    const graph = new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', []],
    ])
    const cycles = detectCycles(graph)
    expect(cycles).toHaveLength(0)
  })

  it('detects a longer A → B → C → A cycle', () => {
    const graph = new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ])
    const cycles = detectCycles(graph)
    expect(cycles.length).toBeGreaterThan(0)
    const flat = cycles.flat()
    expect(flat).toContain('A')
    expect(flat).toContain('B')
    expect(flat).toContain('C')
  })

  it('detects multiple independent cycles', () => {
    const graph = new Map([
      ['A', ['B']],
      ['B', ['A']],
      ['C', ['D']],
      ['D', ['C']],
    ])
    const cycles = detectCycles(graph)
    expect(cycles.length).toBeGreaterThanOrEqual(2)
    const flat = cycles.flat()
    expect(flat).toContain('A')
    expect(flat).toContain('C')
  })
})

describe('filesInCycles', () => {
  it('returns the set of all files participating in any cycle', () => {
    const cycles = [['A', 'B'], ['C', 'D', 'E']]
    const files = filesInCycles(cycles)
    expect(files.has('A')).toBe(true)
    expect(files.has('B')).toBe(true)
    expect(files.has('C')).toBe(true)
    expect(files.has('D')).toBe(true)
    expect(files.has('E')).toBe(true)
    expect(files.has('Z')).toBe(false)
  })

  it('returns an empty set when there are no cycles', () => {
    const files = filesInCycles([])
    expect(files.size).toBe(0)
  })
})
