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

export type AiFileNote = {
  filePath: string
  purpose: StructuredListField
  invariants: StructuredListField
  sensitiveDependencies: StructuredListField
  importantDecisions: StructuredListField
  knownPitfalls: StructuredListField
  impactValidation: StructuredListField
  criticalityScore: number
  generatedAt: string
  model: string
}
