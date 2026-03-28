import type { StaticFileAnalysis, GraphSignals, TestSignals } from '../types/file-analysis.ts'
import type { AiFileNote, EvidenceItem, StructuredListField } from '../types/ai-note.ts'

export function buildBasicNote(
  analysis: StaticFileAnalysis,
  graph: GraphSignals,
  tests: TestSignals,
): AiFileNote {
  const purposeObserved: string[] = []
  const purposeEvidence: EvidenceItem[] = []

  if (analysis.hooks.length > 0) {
    purposeObserved.push(`Exports hooks: ${analysis.hooks.join(', ')}`)
    for (const hook of analysis.hooks) {
      purposeEvidence.push({ type: 'code', detail: `export function ${hook}` })
    }
  }

  if (analysis.exports.length > 0) {
    purposeObserved.push(`Exports: ${analysis.exports.join(', ')}`)
    purposeEvidence.push({ type: 'code', detail: `Exported symbols: ${analysis.exports.join(', ')}` })
  }

  if (graph.reverseDependencies.length > 0) {
    purposeEvidence.push({
      type: 'graph',
      detail: `Consumed by: ${graph.reverseDependencies.slice(0, 3).join(', ')}`,
    })
  }

  const sensitiveDepsObserved: string[] = [
    ...analysis.externalImports,
    ...graph.reverseDependencies.slice(0, 5),
  ]
  const sensitiveDepsEvidence: EvidenceItem[] = [
    ...analysis.externalImports.map((i) => ({ type: 'code' as const, detail: `import from '${i}'` })),
    ...graph.reverseDependencies.slice(0, 5).map((r) => ({ type: 'graph' as const, detail: `Reverse dep: ${r}` })),
  ]

  const pitfallsObserved: string[] = []
  const pitfallsEvidence: EvidenceItem[] = []

  for (const todo of analysis.comments.todo) {
    pitfallsObserved.push(todo)
    pitfallsEvidence.push({ type: 'comment', detail: todo })
  }
  for (const fixme of analysis.comments.fixme) {
    pitfallsObserved.push(fixme)
    pitfallsEvidence.push({ type: 'comment', detail: fixme })
  }
  for (const hack of analysis.comments.hack) {
    pitfallsObserved.push(hack)
    pitfallsEvidence.push({ type: 'comment', detail: hack })
  }

  const impactObserved: string[] = [
    ...graph.reverseDependencies,
    ...tests.relatedTests,
  ]
  const impactEvidence: EvidenceItem[] = [
    ...graph.reverseDependencies.map((r) => ({ type: 'graph' as const, detail: `Consumer: ${r}` })),
    ...tests.relatedTests.map((t) => ({ type: 'test' as const, detail: `Related test: ${t}` })),
  ]

  const criticalityScore = computeCriticality(analysis, graph, tests)

  const emptyField = (): StructuredListField => ({
    observed: [],
    inferred: [],
    confidence: 0,
    evidence: [],
  })

  return {
    filePath: analysis.filePath,
    purpose: {
      observed: purposeObserved,
      inferred: [],
      confidence: purposeObserved.length > 0 ? 0.6 : 0.2,
      evidence: purposeEvidence,
    },
    invariants: emptyField(),
    sensitiveDependencies: {
      observed: sensitiveDepsObserved,
      inferred: [],
      confidence: sensitiveDepsObserved.length > 0 ? 0.85 : 0,
      evidence: sensitiveDepsEvidence,
    },
    importantDecisions: emptyField(),
    knownPitfalls: {
      observed: pitfallsObserved,
      inferred: [],
      confidence: pitfallsObserved.length > 0 ? 0.9 : 0,
      evidence: pitfallsEvidence,
    },
    impactValidation: {
      observed: impactObserved,
      inferred: [],
      confidence: impactObserved.length > 0 ? 0.8 : 0.1,
      evidence: impactEvidence,
    },
    criticalityScore,
    generatedAt: new Date().toISOString(),
    model: 'static',
  }
}

function computeCriticality(
  analysis: StaticFileAnalysis,
  graph: GraphSignals,
  tests: TestSignals,
): number {
  let score = 0

  // More consumers = more critical
  score += Math.min(graph.reverseDependencies.length * 0.1, 0.4)

  // Hooks are generally critical
  if (analysis.hooks.length > 0) score += 0.2

  // External deps (API, env) increase criticality
  if (analysis.externalImports.length > 0) score += 0.1
  if (analysis.envVars.length > 0) score += 0.1

  // Known pitfalls increase criticality
  if (analysis.comments.todo.length + analysis.comments.fixme.length + analysis.comments.hack.length > 0) {
    score += 0.1
  }

  // No tests = higher risk
  if (tests.relatedTests.length === 0) score += 0.1

  return Math.min(parseFloat(score.toFixed(2)), 1)
}
