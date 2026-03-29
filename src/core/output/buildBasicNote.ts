import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../types/file-analysis.ts'
import type { AiFileNote, EvidenceItem, StructuredListField } from '../types/ai-note.ts'

const RISKY_COMMIT_KEYWORDS = ['hotfix', 'rollback', 'workaround', 'revert', 'hack', 'fix', 'breaking']

export function buildBasicNote(
  analysis: StaticFileAnalysis,
  graph: GraphSignals,
  tests: TestSignals,
  git: GitSignals,
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

  // knownPitfalls: comments + risky commit messages + high-frequency co-changes
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

  for (const msg of git.recentCommitMessages) {
    const lower = msg.toLowerCase()
    if (RISKY_COMMIT_KEYWORDS.some((kw) => lower.includes(kw))) {
      pitfallsObserved.push(`Commit: "${msg}"`)
      pitfallsEvidence.push({ type: 'git', detail: msg })
    }
  }

  const highFreqCoChanged = git.coChangedFiles.filter((f) => f.count >= 2)
  if (highFreqCoChanged.length > 0) {
    pitfallsObserved.push(
      `Co-changes frequently with: ${highFreqCoChanged.map((f) => f.path).join(', ')}`,
    )
    for (const f of highFreqCoChanged) {
      pitfallsEvidence.push({ type: 'git', detail: `Co-changed ${f.count}x with ${f.path}` })
    }
  }

  // impactValidation: consumers + tests + co-changed files
  const impactObserved: string[] = [
    ...graph.reverseDependencies,
    ...tests.relatedTests,
    ...git.coChangedFiles.map((f) => f.path),
  ]
  const impactEvidence: EvidenceItem[] = [
    ...graph.reverseDependencies.map((r) => ({ type: 'graph' as const, detail: `Consumer: ${r}` })),
    ...tests.relatedTests.map((t) => ({ type: 'test' as const, detail: `Related test: ${t}` })),
    ...git.coChangedFiles.map((f) => ({ type: 'git' as const, detail: `Co-changed ${f.count}x: ${f.path}` })),
  ]

  const criticalityScore = computeCriticality(analysis, graph, tests, git)

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
      observed: [...new Set(impactObserved)],
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
  git: GitSignals,
): number {
  let score = 0

  // More consumers = more critical (max +0.4 at 4+ consumers)
  score += Math.min(graph.reverseDependencies.length * 0.1, 0.4)

  // Hooks are load-bearing — always critical
  if (analysis.hooks.length > 0) score += 0.2

  // External deps and env vars increase blast radius
  if (analysis.externalImports.length > 0) score += 0.1
  if (analysis.envVars.length > 0) score += 0.1

  // Outbound API calls — runtime failure risk
  if (analysis.apiCalls.length > 0) score += 0.1

  // Known pitfalls in comments
  if (analysis.comments.todo.length + analysis.comments.fixme.length + analysis.comments.hack.length > 0) {
    score += 0.05
  }

  // Untested files: higher penalty when the file has consumers (untested + widely used is riskiest)
  if (tests.relatedTests.length === 0) {
    score += graph.reverseDependencies.length > 0 ? 0.15 : 0.05
  }

  // High churn = more critical (capped at +0.15 at 15+ commits)
  score += Math.min(git.churnScore * 0.01, 0.15)

  // Multiple authors = higher coordination risk
  if (git.authorCount > 3) score += 0.05

  return Math.min(parseFloat(score.toFixed(2)), 1)
}
