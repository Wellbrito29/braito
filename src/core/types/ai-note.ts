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
  generatedAt: string
  model: string
}
