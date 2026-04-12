import MiniSearch from 'minisearch'
import type { AiFileNote, StructuredListField } from '../types/ai-note.ts'

const NOTE_FIELDS = ['purpose', 'invariants', 'knownPitfalls', 'importantDecisions', 'sensitiveDependencies', 'impactValidation'] as const

export const SEARCH_FIELDS = ['purpose', 'invariants', 'knownPitfalls', 'importantDecisions', 'sensitiveDependencies', 'impactValidation', 'evidence'] as const

export type SearchableNote = {
  id: string
  purpose: string
  invariants: string
  knownPitfalls: string
  importantDecisions: string
  sensitiveDependencies: string
  impactValidation: string
  evidence: string
}

function concatField(field: StructuredListField | undefined): string {
  if (!field) return ''
  return [...(field.observed ?? []), ...(field.inferred ?? [])].join(' ')
}

function concatEvidence(note: AiFileNote): string {
  return NOTE_FIELDS
    .flatMap((f) => ((note[f] as StructuredListField)?.evidence ?? []).map((e) => e.detail))
    .join(' ')
}

export function noteToSearchableDoc(relativePath: string, note: AiFileNote): SearchableNote {
  return {
    id: relativePath,
    purpose: concatField(note.purpose),
    invariants: concatField(note.invariants),
    knownPitfalls: concatField(note.knownPitfalls),
    importantDecisions: concatField(note.importantDecisions),
    sensitiveDependencies: concatField(note.sensitiveDependencies),
    impactValidation: concatField(note.impactValidation),
    evidence: concatEvidence(note),
  }
}

export function createMiniSearchInstance(): MiniSearch<SearchableNote> {
  return new MiniSearch<SearchableNote>({
    fields: [...SEARCH_FIELDS],
    storeFields: ['id'],
    idField: 'id',
  })
}

/**
 * Build a serialized MiniSearch index from a map of relative paths to notes.
 * Returns the JSON string ready to be written to disk.
 */
export function buildSearchIndex(notes: Map<string, AiFileNote>): string {
  const ms = createMiniSearchInstance()

  const docs: SearchableNote[] = []
  for (const [relPath, note] of notes) {
    docs.push(noteToSearchableDoc(relPath, note))
  }

  ms.addAll(docs)
  return JSON.stringify(ms)
}

/**
 * Restore a MiniSearch instance from a serialized JSON string.
 */
export function loadSearchIndex(json: string): MiniSearch<SearchableNote> {
  return MiniSearch.loadJSON<SearchableNote>(json, {
    fields: [...SEARCH_FIELDS],
    storeFields: ['id'],
    idField: 'id',
  })
}
