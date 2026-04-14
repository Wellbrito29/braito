import { describe, it, expect } from 'bun:test'
import { llmNoteSchema } from '../../src/core/llm/schemas/aiNoteSchema.ts'

const emptyField = { observed: [], inferred: [], confidence: 0, evidence: [] }

function baseNote() {
  return {
    purpose: { ...emptyField },
    invariants: { ...emptyField },
    sensitiveDependencies: { ...emptyField },
    importantDecisions: { ...emptyField },
    knownPitfalls: { ...emptyField },
    impactValidation: { ...emptyField },
  }
}

describe('llmNoteSchema evidence.type', () => {
  it('accepts all known evidence types', () => {
    const note = baseNote()
    note.purpose = {
      ...emptyField,
      evidence: [
        { type: 'code', detail: 'a' },
        { type: 'git', detail: 'b' },
        { type: 'test', detail: 'c' },
        { type: 'graph', detail: 'd' },
        { type: 'comment', detail: 'e' },
        { type: 'doc', detail: 'f' },
      ],
    }
    const parsed = llmNoteSchema.parse(note)
    expect(parsed.purpose.evidence.map((e) => e.type)).toEqual([
      'code', 'git', 'test', 'graph', 'comment', 'doc',
    ])
  })

  it('coerces unknown evidence types (e.g. "import") to "code" instead of failing', () => {
    const note = baseNote()
    note.invariants = {
      ...emptyField,
      evidence: [
        { type: 'import', detail: 'imports lodash' },
        { type: 'code', detail: 'valid' },
        { type: 'whatever', detail: 'unknown vocabulary' },
      ],
    }
    const parsed = llmNoteSchema.parse(note)
    expect(parsed.invariants.evidence).toEqual([
      { type: 'code', detail: 'imports lodash' },
      { type: 'code', detail: 'valid' },
      { type: 'code', detail: 'unknown vocabulary' },
    ])
  })

  it('still requires evidence.detail to be a string', () => {
    const note = baseNote()
    note.purpose = {
      ...emptyField,
      evidence: [{ type: 'code', detail: 123 } as unknown as { type: 'code'; detail: string }],
    }
    expect(() => llmNoteSchema.parse(note)).toThrow()
  })
})
