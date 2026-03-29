import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../types/file-analysis.ts'
import type { AiFileNote, EvidenceItem, StructuredListField } from '../types/ai-note.ts'

const RISKY_COMMIT_KEYWORDS = ['hotfix', 'rollback', 'workaround', 'revert', 'hack', 'fix', 'breaking']
const VALIDATION_LIBS = ['zod', 'yup', 'joi', 'superstruct', 'valibot', 'arktype']
const DECISION_COMMIT_KEYWORDS = ['because', 'instead of', 'chose', 'migrated', 'switched', 'replaced', 'moved to', 'adopted']

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

  // impactValidation: consumers + tests + co-changed files + coverage
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

  if (tests.coveragePct !== undefined) {
    const pctStr = `${(tests.coveragePct * 100).toFixed(1)}%`
    if (tests.coveragePct < 0.5) {
      impactObserved.push(`Low line coverage: ${pctStr} — high risk for regressions`)
    } else {
      impactObserved.push(`Line coverage: ${pctStr}`)
    }
    impactEvidence.push({ type: 'test', detail: `Coverage report: ${pctStr} lines covered` })
  }

  const criticalityScore = computeCriticality(analysis, graph, tests, git)

  // invariants: explicit comments + structural heuristics
  const invariantsObserved: string[] = []
  const invariantsEvidence: EvidenceItem[] = []

  for (const inv of analysis.comments.invariant) {
    invariantsObserved.push(inv)
    invariantsEvidence.push({ type: 'comment', detail: inv })
  }

  const validationLib = analysis.externalImports.find((i) =>
    VALIDATION_LIBS.includes(i.split('/')[0]),
  )
  if (validationLib) {
    invariantsObserved.push(`Runtime schema validation via '${validationLib}'`)
    invariantsEvidence.push({ type: 'code', detail: `import from '${validationLib}'` })
  }

  if (analysis.envVars.length > 0) {
    invariantsObserved.push(`Requires env vars to be set: ${analysis.envVars.join(', ')}`)
    for (const v of analysis.envVars) {
      invariantsEvidence.push({ type: 'code', detail: `process.env.${v}` })
    }
  }

  if (analysis.hooks.length > 0) {
    invariantsObserved.push('Exported hooks must follow React hooks rules (name starts with "use")')
    invariantsEvidence.push({ type: 'code', detail: `hooks: ${analysis.hooks.join(', ')}` })
  }

  // importantDecisions: explicit comments + decision-flavoured commit messages
  const decisionsObserved: string[] = []
  const decisionsEvidence: EvidenceItem[] = []

  for (const dec of analysis.comments.decision) {
    decisionsObserved.push(dec)
    decisionsEvidence.push({ type: 'comment', detail: dec })
  }

  for (const msg of git.recentCommitMessages) {
    const lower = msg.toLowerCase()
    if (DECISION_COMMIT_KEYWORDS.some((kw) => lower.includes(kw))) {
      decisionsObserved.push(`Commit: "${msg}"`)
      decisionsEvidence.push({ type: 'git', detail: msg })
    }
  }

  return {
    filePath: analysis.filePath,
    purpose: {
      observed: purposeObserved,
      inferred: [],
      confidence: purposeObserved.length > 0 ? 0.6 : 0.2,
      evidence: purposeEvidence,
    },
    invariants: {
      observed: invariantsObserved,
      inferred: [],
      confidence: invariantsObserved.length > 0 ? 0.75 : 0,
      evidence: invariantsEvidence,
    },
    sensitiveDependencies: {
      observed: sensitiveDepsObserved,
      inferred: [],
      confidence: sensitiveDepsObserved.length > 0 ? 0.85 : 0,
      evidence: sensitiveDepsEvidence,
    },
    importantDecisions: {
      observed: decisionsObserved,
      inferred: [],
      confidence: decisionsObserved.length > 0 ? 0.7 : 0,
      evidence: decisionsEvidence,
    },
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
