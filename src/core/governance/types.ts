/**
 * Governance context types.
 * Represents structured knowledge extracted from project documentation
 * artifacts (Docs/, Workflows/, Quality/, Skills/, etc.).
 */

/** A detected governance document in the project */
export type GovernanceDoc = {
  /** Relative path from project root (e.g. "Docs/architecture.md") */
  path: string
  /** Category of the document */
  category: 'brief' | 'architecture' | 'contract' | 'plan' | 'tasks' | 'stack' | 'structure' | 'workflow' | 'quality' | 'skill' | 'other'
  /** Document title (first heading or filename) */
  title: string
  /** Extracted sections — heading → content */
  sections: Map<string, string>
  /** Raw content (truncated to maxChars) */
  rawContent: string
}

/** Summary of the governance model detected in the project */
export type GovernanceModel = {
  /** Whether governance docs were detected */
  detected: boolean
  /** Style of governance (nebula-like, custom, or none) */
  style: 'nebula-like' | 'custom' | 'none'
  /** All discovered governance documents */
  docs: GovernanceDoc[]
  /** Domain mappings: file path pattern → governing doc path */
  domainMappings: Array<{ pattern: string; docPath: string }>
}

/** Governance context passed into the note-building pipeline */
export type GovernanceContext = {
  model: GovernanceModel
  /** Summarized text for LLM prompt injection */
  promptSummary: string
  /** File-level governance info keyed by relative file path */
  fileGovernance: Map<string, FileGovernanceInfo>
}

/** Governance info relevant to a specific source file */
export type FileGovernanceInfo = {
  /** Docs that govern or mention this file/area */
  governingDocs: string[]
  /** Relevant constraints or rules extracted from docs */
  constraints: string[]
  /** Relevant architectural decisions from docs */
  decisions: string[]
}
