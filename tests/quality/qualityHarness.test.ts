import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { runGenerate } from '../../src/cli/commands/generate.ts'

// ---------------------------------------------------------------------------
// Quality harness — deterministic regression gate for the static pipeline.
//
// For each curated fixture file we declare expectations that should hold
// *without any LLM*. This catches regressions in filename classification,
// import categorization, cross-signal inferences, AST extractors, and the
// aggregation wiring (note → index).
//
// When you change a prompt or tune the static enrichers, run:
//     bun test tests/quality/qualityHarness.test.ts
//
// A failing expectation tells you exactly which static signal stopped
// firing, so you know what to fix.
// ---------------------------------------------------------------------------

type Expectation = {
  /** Minimum length of purpose.observed[]. */
  minPurposeItems?: number
  /** Regex patterns that MUST match somewhere in purpose.observed. */
  purposeMustContain?: RegExp[]
  /** Minimum length of invariants.observed[]. */
  minInvariantItems?: number
  /** Regex patterns that MUST match somewhere in invariants.observed. */
  invariantsMustContain?: RegExp[]
  /** Regex patterns that MUST match somewhere in knownPitfalls.observed. */
  pitfallsMustContain?: RegExp[]
  /** knownPitfalls.observed should be empty (e.g., a plain utility with tests). */
  pitfallsMustBeEmpty?: boolean
}

const FIXTURE_SRC = path.resolve(import.meta.dir, '../fixtures/quality-harness')

const EXPECTATIONS: Record<string, Expectation> = {
  'src/api/user.controller.ts': {
    minPurposeItems: 2,
    purposeMustContain: [/HTTP controller/i],
  },
  // user.service IS a consumer of DTOs/entities — the "no related tests"
  // pitfall should fire on files that have consumers but no spec file.
  // We assert that on user.entity (consumed by service, no test).
  'src/domain/user.service.ts': {
    minPurposeItems: 2,
    purposeMustContain: [/Service/],
    invariantsMustContain: [/database/i, /HTTP request/i],
  },
  'src/domain/user.dto.ts': {
    purposeMustContain: [/Data transfer object|DTO/i],
    invariantsMustContain: [/validation/i],
  },
  'src/domain/user.entity.ts': {
    purposeMustContain: [/Domain entity|persistence model/i],
    invariantsMustContain: [/cryptographic/i],
    pitfallsMustContain: [/no related tests/i],
  },
  'src/infra/logger.middleware.ts': {
    purposeMustContain: [/HTTP middleware/i],
    invariantsMustContain: [/env vars|LOG_LEVEL/i],
  },
  'src/hooks/useAuth.ts': {
    purposeMustContain: [/React hook/i],
    invariantsMustContain: [/hooks rules/i],
  },
}

let tmpRoot: string

beforeAll(async () => {
  // Copy the fixture to a tempdir so .ai-notes/ doesn't pollute the repo
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-quality-'))
  copyRecursive(FIXTURE_SRC, tmpRoot)
  await runGenerate({ root: tmpRoot })
})

afterAll(() => {
  if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true })
})

function copyRecursive(from: string, to: string): void {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dst = path.join(to, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(dst, { recursive: true })
      copyRecursive(src, dst)
    } else {
      fs.copyFileSync(src, dst)
    }
  }
}

function loadNote(relativePath: string): {
  purpose: { observed: string[] }
  invariants: { observed: string[] }
  knownPitfalls: { observed: string[] }
  model: string
} {
  const notePath = path.join(tmpRoot, '.ai-notes', relativePath + '.json')
  return JSON.parse(fs.readFileSync(notePath, 'utf-8'))
}

function assertMatches(arr: string[], patterns: RegExp[], label: string, file: string): void {
  for (const p of patterns) {
    const hit = arr.some((item) => p.test(item))
    if (!hit) {
      throw new Error(
        `[${file}] expected ${label} to match ${p.source} — got:\n  ${arr.map((i) => '"' + i + '"').join('\n  ')}`,
      )
    }
  }
}

describe('quality harness — static pipeline', () => {
  for (const [relPath, exp] of Object.entries(EXPECTATIONS)) {
    it(`${relPath} meets static expectations`, () => {
      const note = loadNote(relPath)

      if (exp.minPurposeItems !== undefined) {
        expect(note.purpose.observed.length).toBeGreaterThanOrEqual(exp.minPurposeItems)
      }
      if (exp.purposeMustContain) {
        assertMatches(note.purpose.observed, exp.purposeMustContain, 'purpose.observed', relPath)
      }
      if (exp.minInvariantItems !== undefined) {
        expect(note.invariants.observed.length).toBeGreaterThanOrEqual(exp.minInvariantItems)
      }
      if (exp.invariantsMustContain) {
        assertMatches(note.invariants.observed, exp.invariantsMustContain, 'invariants.observed', relPath)
      }
      if (exp.pitfallsMustContain) {
        assertMatches(note.knownPitfalls.observed, exp.pitfallsMustContain, 'knownPitfalls.observed', relPath)
      }
      if (exp.pitfallsMustBeEmpty) {
        expect(note.knownPitfalls.observed).toEqual([])
      }
    })
  }

  it('aggregate quality floor across all fixture files', () => {
    const files = Object.keys(EXPECTATIONS)
    let purposeTotal = 0
    let invariantTotal = 0
    for (const f of files) {
      const n = loadNote(f)
      purposeTotal += n.purpose.observed.length
      invariantTotal += n.invariants.observed.length
    }
    const avgPurpose = purposeTotal / files.length
    const avgInvariants = invariantTotal / files.length

    // Floor: after enrichment, every fixture should average > 1 purpose item
    // and > 0.5 invariant items. If either drops below, the enricher
    // regressed across the board.
    expect(avgPurpose).toBeGreaterThan(1.0)
    expect(avgInvariants).toBeGreaterThan(0.5)
  })
})
