import { describe, it, expect } from 'bun:test'
import { parseLcov } from '../../src/core/tests/parseLcov.ts'

const SAMPLE_LCOV = `
SF:src/core/graph/buildDependencyGraph.ts
LF:20
LH:18
end_of_record
SF:src/core/output/buildBasicNote.ts
LF:50
LH:10
end_of_record
SF:src/cli/index.ts
LF:0
LH:0
end_of_record
`.trim()

describe('parseLcov', () => {
  it('parses line coverage ratio per file', () => {
    const coverage = parseLcov(SAMPLE_LCOV)
    expect(coverage.get('src/core/graph/buildDependencyGraph.ts')).toBeCloseTo(0.9)
    expect(coverage.get('src/core/output/buildBasicNote.ts')).toBeCloseTo(0.2)
  })

  it('excludes files with zero tracked lines', () => {
    const coverage = parseLcov(SAMPLE_LCOV)
    expect(coverage.has('src/cli/index.ts')).toBe(false)
  })

  it('returns empty map for empty input', () => {
    expect(parseLcov('').size).toBe(0)
  })
})
