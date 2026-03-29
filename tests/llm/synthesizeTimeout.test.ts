import { describe, it, expect } from 'bun:test'
import { synthesizeFileNote } from '../../src/core/llm/synthesizeFileNote.ts'
import type { LLMProvider } from '../../src/core/llm/provider/types.ts'
import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../../src/core/types/file-analysis.ts'
import type { AiFileNote } from '../../src/core/types/ai-note.ts'

function makeStaticNote(overrides: Partial<AiFileNote> = {}): AiFileNote {
  const empty = { observed: [], inferred: [], confidence: 0, evidence: [] }
  return {
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
  const git: GitSignals = { filePath: staticNote.filePath, churnScore: 0, recentCommitMessages: [], coChangedFiles: [], authorCount: 0 }
  return { analysis, graph, tests, git, staticNote }
}

describe('synthesizeFileNote — timeout', () => {
  it('falls back to static note when provider exceeds timeoutMs', async () => {
    // Provider that never resolves within the timeout window
    const slowProvider: LLMProvider = {
      complete: () => new Promise<never>(() => { /* never resolves */ }),
    }

    const staticNote = makeStaticNote()
    const result = await synthesizeFileNote(makeCtx(staticNote), slowProvider, 0.2, 50)

    expect(result.model).toBe('static')
    expect(result).toEqual(staticNote)
  }, 5000)

  it('falls back to static note and preserves all fields on timeout', async () => {
    const slowProvider: LLMProvider = {
      complete: () => new Promise<never>(() => { /* never resolves */ }),
    }

    const staticNote = makeStaticNote({
      criticalityScore: 0.9,
      purpose: { observed: ['Critical path handler'], inferred: [], confidence: 0.8, evidence: [] },
    })
    const result = await synthesizeFileNote(makeCtx(staticNote), slowProvider, 0.2, 50)

    expect(result.model).toBe('static')
    expect(result.criticalityScore).toBe(0.9)
    expect(result.purpose.observed).toContain('Critical path handler')
    expect(result.purpose.inferred).toHaveLength(0)
  }, 5000)

  it('completes successfully when provider responds before timeout', async () => {
    const validResponse = JSON.stringify({
      purpose: { observed: [], inferred: ['Fast response'], confidence: 0.9, evidence: [] },
      invariants: { observed: [], inferred: [], confidence: 0, evidence: [] },
      sensitiveDependencies: { observed: [], inferred: [], confidence: 0, evidence: [] },
      importantDecisions: { observed: [], inferred: [], confidence: 0, evidence: [] },
      knownPitfalls: { observed: [], inferred: [], confidence: 0, evidence: [] },
      impactValidation: { observed: [], inferred: [], confidence: 0, evidence: [] },
    })

    const fastProvider: LLMProvider = {
      complete: async () => ({ content: validResponse, model: 'fast-model' }),
    }

    const staticNote = makeStaticNote()
    // Use a generous timeout — provider responds immediately
    const result = await synthesizeFileNote(makeCtx(staticNote), fastProvider, 0.2, 5000)

    expect(result.model).toBe('fast-model')
    expect(result.purpose.inferred).toContain('Fast response')
  })
})
