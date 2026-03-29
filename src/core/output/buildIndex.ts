import path from 'node:path'
import type { AiFileNote } from '../types/ai-note.ts'
import { isNoteStale } from '../cache/isNoteStale.ts'
import { DEFAULT_STALE_THRESHOLD_DAYS } from '../config/defaults.ts'

export type IndexEntry = {
  filePath: string
  relativePath: string
  domain: string
  criticalityScore: number
  model: string
  purpose: string
  generatedAt: string
  stale: boolean
}

export type NoteIndex = {
  generatedAt: string
  totalFiles: number
  synthesizedFiles: number
  staleFiles: number
  entries: IndexEntry[]
}

/**
 * Derives a domain label from a relative file path.
 * - `packages/<name>/…` or `apps/<name>/…` or `libs/<name>/…` → first two segments
 * - Anything else → first directory segment (or '.' for root-level files)
 */
function deriveDomain(relativePath: string): string {
  const parts = relativePath.split('/')
  if (parts.length === 1) return '.'
  const MONOREPO_ROOTS = ['packages', 'apps', 'libs', 'modules', 'services']
  if (MONOREPO_ROOTS.includes(parts[0]) && parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`
  }
  return parts[0]
}

export function buildIndex(
  notes: AiFileNote[],
  root: string,
  staleThresholdDays = DEFAULT_STALE_THRESHOLD_DAYS,
): NoteIndex {
  const entries: IndexEntry[] = notes
    .map((note) => {
      const relativePath = path.relative(root, note.filePath)
      return {
        filePath: note.filePath,
        relativePath,
        domain: deriveDomain(relativePath),
        criticalityScore: note.criticalityScore,
        model: note.model,
        purpose: note.purpose.observed[0] ?? note.purpose.inferred[0] ?? '',
        generatedAt: note.generatedAt,
        stale: isNoteStale(note.generatedAt, staleThresholdDays),
      }
    })
    .sort((a, b) => b.criticalityScore - a.criticalityScore)

  const synthesizedFiles = notes.filter((n) => n.model !== 'static').length
  const staleFiles = entries.filter((e) => e.stale).length

  return {
    generatedAt: new Date().toISOString(),
    totalFiles: notes.length,
    synthesizedFiles,
    staleFiles,
    entries,
  }
}
