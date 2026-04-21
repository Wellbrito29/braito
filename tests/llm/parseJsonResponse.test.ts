import { describe, it, expect } from 'bun:test'
import { parseJsonResponse } from '../../src/core/llm/parseJsonResponse.ts'

describe('parseJsonResponse', () => {
  it('parses pure JSON unchanged', () => {
    const raw = '{"a":1,"b":[2,3]}'
    expect(parseJsonResponse(raw)).toEqual({ a: 1, b: [2, 3] })
  })

  it('parses JSON wrapped in ```json ... ``` fences', () => {
    const raw = '```json\n{"a":1}\n```'
    expect(parseJsonResponse(raw)).toEqual({ a: 1 })
  })

  it('parses JSON wrapped in plain ``` fences', () => {
    const raw = '```\n{"a":1}\n```'
    expect(parseJsonResponse(raw)).toEqual({ a: 1 })
  })

  it('extracts JSON when the model prefixes prose ("Looking at this file...")', () => {
    const raw = `Looking at this file, here is my analysis:\n\n{"purpose":{"observed":[],"inferred":["x"],"confidence":0.5,"evidence":[]}}`
    const out = parseJsonResponse(raw) as { purpose: { inferred: string[] } }
    expect(out.purpose.inferred).toEqual(['x'])
  })

  it('extracts JSON when the model prefixes prose ("Now let me...")', () => {
    const raw = `Now let me synthesize the note for this file.\n\n{"score":0.95}\n\nThat is my final answer.`
    expect(parseJsonResponse(raw)).toEqual({ score: 0.95 })
  })

  it('extracts JSON inside fenced block surrounded by prose', () => {
    const raw = `Here is the analysis:\n\n\`\`\`json\n{"k":"v"}\n\`\`\`\n\nLet me know if you need more.`
    expect(parseJsonResponse(raw)).toEqual({ k: 'v' })
  })

  it('handles nested objects with braces inside string values', () => {
    const raw = `Preamble {ignored} text\n{"detail":"contains } and { inside","n":1}`
    expect(parseJsonResponse(raw)).toEqual({ detail: 'contains } and { inside', n: 1 })
  })

  it('handles escaped quotes inside string values', () => {
    const raw = `prose\n{"quoted":"a \\"b\\" c"}`
    expect(parseJsonResponse(raw)).toEqual({ quoted: 'a "b" c' })
  })

  it('throws when no JSON object is present at all', () => {
    expect(() => parseJsonResponse('I cannot help with that.')).toThrow(/Could not extract JSON/)
  })

  it('throws when extracted block is malformed', () => {
    // Opening brace with no closing brace ever — extraction returns null
    expect(() => parseJsonResponse('Looking at this... {"a":1')).toThrow(/Could not extract JSON/)
  })
})
