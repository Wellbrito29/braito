import path from 'node:path'
import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../types/file-analysis.ts'
import type { AiFileNote, ChangelogEntry, DebugSignals, EvidenceItem, StructuredListField } from '../types/ai-note.ts'
import type { GovernanceContext } from '../governance/types.ts'
import type { Divergence } from '../governance/detectDivergence.ts'
import { SCHEMA_VERSION } from '../types/schema-version.ts'

const RISKY_COMMIT_KEYWORDS = ['hotfix', 'rollback', 'workaround', 'revert', 'hack', 'fix', 'breaking']
const VALIDATION_LIBS = ['zod', 'yup', 'joi', 'superstruct', 'valibot', 'arktype']

// Conventional-commit style prefixes are language-agnostic, so we match them everywhere.
const DECISION_COMMIT_PATTERNS: RegExp[] = [
  /^refactor[:(]/i,
  /^revert[:(]/i,
  /^perf[:(]/i,
]

// Natural-language keywords — language tag from config selects the table.
const DECISION_KEYWORDS_BY_LANG: Record<string, string[]> = {
  en: ['because', 'instead of', 'chose', 'migrated', 'switched', 'replaced', 'moved to', 'adopted', 'refactor'],
  'pt-BR': ['porque', 'em vez de', 'escolhido', 'escolhemos', 'migrou', 'migramos', 'substituiu', 'substituímos', 'refatoração', 'refatorando', 'refatorou', 'adotou', 'adotamos'],
  pt: ['porque', 'em vez de', 'escolhido', 'escolhemos', 'migrou', 'substituiu', 'refatoração', 'refatorando', 'adotou'],
  es: ['porque', 'en lugar de', 'elegido', 'migró', 'reemplazó', 'refactorización', 'adoptó'],
  fr: ['parce que', 'au lieu de', 'choisi', 'migré', 'remplacé', 'refactorisation', 'adopté'],
  de: ['weil', 'anstatt', 'gewählt', 'migriert', 'ersetzt', 'refaktorierung', 'übernommen'],
  it: ["perché", "invece di", "scelto", "migrato", "sostituito", "rifattorizzazione", "adottato"],
}

function getDecisionKeywords(language: string): string[] {
  if (DECISION_KEYWORDS_BY_LANG[language]) return DECISION_KEYWORDS_BY_LANG[language]
  const base = language.split('-')[0]
  return DECISION_KEYWORDS_BY_LANG[base] ?? DECISION_KEYWORDS_BY_LANG.en
}

function isDecisionCommit(message: string, keywords: string[]): boolean {
  if (DECISION_COMMIT_PATTERNS.some((re) => re.test(message))) return true
  const lower = message.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

export function buildBasicNote(
  analysis: StaticFileAnalysis,
  graph: GraphSignals,
  tests: TestSignals,
  git: GitSignals,
  cycleFiles?: Set<string>,
  governance?: GovernanceContext | null,
  divergences?: Divergence[],
  root?: string,
  language: string = 'en',
): AiFileNote {
  // Render absolute paths relative to root so notes are portable and readable.
  // External paths (e.g. 'node_modules/x') and strings that aren't paths pass through.
  const rel = (p: string): string => {
    if (!root || !p.startsWith('/')) return p
    const r = path.relative(root, p)
    return r.startsWith('..') ? p : r
  }
  const relList = (xs: string[]): string[] => xs.map(rel)
  const reverseDeps = relList(graph.reverseDependencies)
  const directDeps = relList(graph.directDependencies)
  const purposeObserved: string[] = []
  const purposeEvidence: EvidenceItem[] = []

  if (analysis.hooks.length > 0) {
    for (const hook of analysis.hooks) {
      const detail = analysis.exportDetails.find((d) => d.name === hook)
      const sig = detail ? detail.signature : `${hook}()`
      const desc = detail?.docComment ? ` — ${detail.docComment}` : ''
      purposeObserved.push(`Hook: ${sig}${desc}`)
      purposeEvidence.push({ type: 'code', detail: `export function ${sig}` })
    }
  }

  if (analysis.exportDetails.length > 0) {
    for (const det of analysis.exportDetails) {
      // Skip hooks already listed above
      if (analysis.hooks.includes(det.name)) continue
      const desc = det.docComment ? ` — ${det.docComment}` : ''
      purposeObserved.push(`${det.kind === 'type' ? 'Type' : 'Export'}: ${det.signature}${desc}`)
      purposeEvidence.push({ type: 'code', detail: det.signature })
    }
  } else if (analysis.exports.length > 0 && analysis.hooks.length === 0) {
    // Fallback for non-TS files (Python/Go analyzers don't produce exportDetails)
    purposeObserved.push(`Exports: ${analysis.exports.join(', ')}`)
    purposeEvidence.push({ type: 'code', detail: `Exported symbols: ${analysis.exports.join(', ')}` })
  }

  // Enrich static-only notes with contextual purpose hints
  if (analysis.hasSideEffects && purposeObserved.length <= 1) {
    purposeObserved.push('Has side effects (module-level execution)')
    purposeEvidence.push({ type: 'code', detail: 'Module has top-level side effects' })
  }
  if (analysis.apiCalls.length > 0 && purposeObserved.length <= 2) {
    purposeObserved.push(`Makes API calls: ${analysis.apiCalls.slice(0, 3).join(', ')}`)
    purposeEvidence.push({ type: 'code', detail: `API calls: ${analysis.apiCalls.join(', ')}` })
  }

  if (reverseDeps.length > 0) {
    purposeEvidence.push({
      type: 'graph',
      detail: `Consumed by: ${reverseDeps.slice(0, 3).join(', ')}`,
    })
  }

  const sensitiveDepsObserved: string[] = [
    ...analysis.externalImports,
    ...reverseDeps.slice(0, 5),
  ]
  const sensitiveDepsEvidence: EvidenceItem[] = [
    ...analysis.externalImports.map((i) => ({ type: 'code' as const, detail: `import from '${i}'` })),
    ...reverseDeps.slice(0, 5).map((r) => ({ type: 'graph' as const, detail: `Reverse dep: ${r}` })),
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

  // Risky commit messages are kept as evidence for the LLM to reason about,
  // but not promoted to observed pitfalls — a risky commit message alone isn't
  // a pitfall, just a signal. Let the LLM decide what to highlight.
  for (const msg of git.recentCommitMessages) {
    const lower = msg.toLowerCase()
    if (RISKY_COMMIT_KEYWORDS.some((kw) => lower.includes(kw))) {
      pitfallsEvidence.push({ type: 'git', detail: msg })
    }
  }

  const highFreqCoChanged = git.coChangedFiles
    .filter((f) => f.count >= 2)
    .map((f) => ({ path: rel(f.path), count: f.count }))
  if (highFreqCoChanged.length > 0) {
    pitfallsObserved.push(
      `Co-changes frequently with: ${highFreqCoChanged.map((f) => f.path).join(', ')}`,
    )
    // Per-file co-change evidence lives in impactValidation only — no duplication here.
    pitfallsEvidence.push({ type: 'git', detail: `Co-changed with ${highFreqCoChanged.length} files (see impactValidation)` })
  }

  if (cycleFiles?.has(analysis.filePath)) {
    pitfallsObserved.push('Participates in a circular import cycle')
    pitfallsEvidence.push({ type: 'graph', detail: 'File is part of a circular dependency cycle' })
  }

  if (divergences && divergences.length > 0) {
    for (const d of divergences) {
      const prefix = d.severity === 'error' ? 'Divergence (error)' : d.severity === 'warn' ? 'Divergence' : 'Divergence (info)'
      pitfallsObserved.push(`${prefix}: ${d.message}`)
      pitfallsEvidence.push({ type: 'doc', detail: d.docPath ? `${d.docPath}: ${d.message}` : d.message })
    }
  }

  // impactValidation: consumers + tests + co-changed files + coverage
  const relatedTests = relList(tests.relatedTests)
  const coChanges = git.coChangedFiles.map((f) => ({ path: rel(f.path), count: f.count }))
  const impactObserved: string[] = [
    ...reverseDeps,
    ...relatedTests,
    ...coChanges.map((f) => f.path),
  ]
  const impactEvidence: EvidenceItem[] = [
    ...reverseDeps.map((r) => ({ type: 'graph' as const, detail: `Consumer: ${r}` })),
    ...relatedTests.map((t) => ({ type: 'test' as const, detail: `Related test: ${t}` })),
    ...coChanges.map((f) => ({ type: 'git' as const, detail: `Co-changed ${f.count}x: ${f.path}` })),
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

  const recentChanges: ChangelogEntry[] = git.recentCommits.map((c) => ({
    hash: c.hash,
    date: c.date,
    message: c.message,
    author: c.author,
  }))

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

  const decisionKeywords = getDecisionKeywords(language)
  for (const msg of git.recentCommitMessages) {
    if (isDecisionCommit(msg, decisionKeywords)) {
      decisionsObserved.push(`Commit: "${msg}"`)
      decisionsEvidence.push({ type: 'git', detail: msg })
    }
  }

  // Inject governance evidence if available
  if (governance) {
    const relPath = analysis.filePath.startsWith('/') ? path.relative(path.dirname(analysis.filePath.split('/src/')[0] || analysis.filePath), analysis.filePath) : analysis.filePath
    const fileInfo = governance.fileGovernance.get(relPath) ??
      governance.fileGovernance.get(analysis.filePath) ??
      findGovernanceByPrefix(governance, relPath)

    if (fileInfo) {
      for (const docPath of fileInfo.governingDocs) {
        purposeObserved.push(`Governed by: ${docPath}`)
        purposeEvidence.push({ type: 'doc', detail: `Governance document: ${docPath}` })
      }
      for (const constraint of fileInfo.constraints) {
        invariantsObserved.push(`Doc constraint: ${constraint}`)
        invariantsEvidence.push({ type: 'doc', detail: constraint })
      }
      for (const decision of fileInfo.decisions) {
        decisionsObserved.push(`Doc decision: ${decision}`)
        decisionsEvidence.push({ type: 'doc', detail: decision })
      }
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
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
    recentChanges,
    criticalityScore,
    debugSignals: {
      reverseDepCount: graph.reverseDependencies.length,
      directDepCount: graph.directDependencies.length,
      hasHooks: analysis.hooks.length > 0,
      hasExternalImports: analysis.externalImports.length > 0,
      hasEnvVars: analysis.envVars.length > 0,
      hasApiCalls: analysis.apiCalls.length > 0,
      hasTodoComments:
        analysis.comments.todo.length +
        analysis.comments.fixme.length +
        analysis.comments.hack.length >
        0,
      hasTests: tests.relatedTests.length > 0,
      coveragePct: tests.coveragePct ?? null,
      churnScore: git.churnScore,
      authorCount: git.authorCount,
      coChangedFiles: git.coChangedFiles,
    } satisfies DebugSignals,
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

  // High co-change coupling: files frequently changed together are operationally critical
  // even when they have few direct import-graph consumers (e.g. DI-injected classes).
  // Self-normalized against churn so it works on repos of any activity level.
  const maxCoChange = git.coChangedFiles.reduce((m, f) => Math.max(m, f.count), 0)
  const coChangeRatio = maxCoChange / Math.max(1, git.churnScore)
  if (coChangeRatio >= 0.6 && maxCoChange >= 3) score += 0.15
  else if (coChangeRatio >= 0.4 && maxCoChange >= 2) score += 0.1

  return Math.min(parseFloat(score.toFixed(2)), 1)
}

/** Find governance info by matching any prefix of the file path */
function findGovernanceByPrefix(governance: GovernanceContext, relPath: string): import('../governance/types.ts').FileGovernanceInfo | undefined {
  for (const [key, info] of governance.fileGovernance) {
    if (relPath.includes(key) || key.includes(relPath)) return info
  }
  for (const mapping of governance.model.domainMappings) {
    if (relPath.startsWith(mapping.pattern)) {
      return { governingDocs: [mapping.docPath], constraints: [], decisions: [] }
    }
  }
  return undefined
}
