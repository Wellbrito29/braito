export type EvidenceItem = {
  type: 'code' | 'git' | 'test' | 'graph' | 'comment' | 'doc'
  detail: string
}

export type StructuredListField = {
  observed: string[]
  inferred: string[]
  confidence: number
  evidence: EvidenceItem[]
}

export type ChangelogEntry = {
  hash: string
  date: string    // ISO 8601
  message: string
  author: string
}

/** Raw pipeline signals persisted for the Debug tab in the UI */
export type DebugSignals = {
  reverseDepCount: number
  directDepCount: number
  hasHooks: boolean
  hasExternalImports: boolean
  hasEnvVars: boolean
  hasApiCalls: boolean
  hasTodoComments: boolean
  hasTests: boolean
  coveragePct: number | null
  churnScore: number
  authorCount: number
  coChangedFiles: Array<{ path: string; count: number }>
}

export type AiFileNote = {
  schemaVersion: string
  filePath: string
  purpose: StructuredListField
  invariants: StructuredListField
  sensitiveDependencies: StructuredListField
  importantDecisions: StructuredListField
  knownPitfalls: StructuredListField
  impactValidation: StructuredListField
  recentChanges: ChangelogEntry[]
  criticalityScore: number
  debugSignals: DebugSignals
  generatedAt: string
  model: string
}
