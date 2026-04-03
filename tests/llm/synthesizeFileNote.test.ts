import { describe, it, expect, mock } from 'bun:test'
import { synthesizeFileNote } from '../../src/core/llm/synthesizeFileNote.ts'
import type { LLMProvider } from '../../src/core/llm/provider/types.ts'
import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../../src/core/types/file-analysis.ts'
import type { AiFileNote } from '../../src/core/types/ai-note.ts'

function makeStaticNote(overrides: Partial<AiFileNote> = {}): AiFileNote {
  const empty = { observed: [], inferred: [], confidence: 0, evidence: [] }
  return {
    schemaVersion: '1.0.0',
    filePath: '/project/src/useSearch.ts',
    purpose: { observed: ['Exports hooks: useSearch'], inferred: [], confidence: 0.6, evidence: [] },
    invariants: empty,
    sensitiveDependencies: empty,
    importantDecisions: empty,
    knownPitfalls: empty,
    impactValidation: empty,
    criticalityScore: 0.5,
    generatedAt: new Date().toISOString(),
    model: 'static',
    ...overrides,
  }
}

function makeCtx(staticNote: AiFileNote) {
  const analysis: StaticFileAnalysis = {
    filePath: staticNote.filePath,
    imports: [], localImports: [], externalImports: [],
    exports: ['useSearch'], symbols: ['useSearch'], hooks: ['useSearch'],
    envVars: [], apiCalls: [],
    comments: { todo: [], fixme: [], hack: [] },
    hasSideEffects: false,
  }
  const graph: GraphSignals = { filePath: staticNote.filePath, directDependencies: [], reverseDependencies: [] }
  const tests: TestSignals = { filePath: staticNote.filePath, relatedTests: [] }
  const git: GitSignals = { filePath: staticNote.filePath, churnScore: 0, recentCommitMessages: [], recentCommits: [], coChangedFiles: [], authorCount: 0 }
  return { analysis, graph, tests, git, staticNote }
}

const validLLMResponse = JSON.stringify({
  purpose: { observed: [], inferred: ['Orchestrates image search flow'], confidence: 0.89, evidence: [{ type: 'code', detail: 'export function useSearch' }] },
  invariants: { observed: [], inferred: ['Must preserve shape expected by consumers'], confidence: 0.75, evidence: [] },
  sensitiveDependencies: { observed: [], inferred: [], confidence: 0, evidence: [] },
  importantDecisions: { observed: [], inferred: [], confidence: 0, evidence: [] },
  knownPitfalls: { observed: [], inferred: [], confidence: 0, evidence: [] },
  impactValidation: { observed: [], inferred: [], confidence: 0, evidence: [] },
})

describe('synthesizeFileNote', () => {
  it('merges LLM inferred into static observed', async () => {
    const provider: LLMProvider = {
      complete: async () => ({ content: validLLMResponse, model: 'llama3' }),
    }

    const staticNote = makeStaticNote()
    const result = await synthesizeFileNote(makeCtx(staticNote), provider)

    expect(result.model).toBe('llama3')
    expect(result.purpose.observed).toEqual(staticNote.purpose.observed)
    expect(result.purpose.inferred).toContain('Orchestrates image search flow')
    expect(result.invariants.inferred).toContain('Must preserve shape expected by consumers')
  })

  it('falls back to static note on invalid LLM response', async () => {
    const provider: LLMProvider = {
      complete: async () => ({ content: '{ invalid json }}}', model: 'llama3' }),
    }

    const staticNote = makeStaticNote()
    const result = await synthesizeFileNote(makeCtx(staticNote), provider)

    expect(result.model).toBe('static')
    expect(result).toEqual(staticNote)
  })

  it('falls back to static note on LLM error', async () => {
    const provider: LLMProvider = {
      complete: async () => { throw new Error('connection refused') },
    }

    const staticNote = makeStaticNote()
    const result = await synthesizeFileNote(makeCtx(staticNote), provider)

    expect(result.model).toBe('static')
  })

  it('falls back to static note on schema validation failure', async () => {
    const provider: LLMProvider = {
      complete: async () => ({ content: JSON.stringify({ purpose: 'wrong shape' }), model: 'llama3' }),
    }

    const staticNote = makeStaticNote()
    const result = await synthesizeFileNote(makeCtx(staticNote), provider)

    expect(result.model).toBe('static')
  })
})
