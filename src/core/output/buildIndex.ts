import path from 'node:path'
import type { AiFileNote } from '../types/ai-note.ts'

export type IndexEntry = {
  filePath: string
  relativePath: string
  criticalityScore: number
  model: string
  purpose: string
  generatedAt: string
}

export type NoteIndex = {
  generatedAt: string
  totalFiles: number
  synthesizedFiles: number
  entries: IndexEntry[]
}

export function buildIndex(notes: AiFileNote[], root: string): NoteIndex {
  const entries: IndexEntry[] = notes
    .map((note) => ({
      filePath: note.filePath,
      relativePath: path.relative(root, note.filePath),
      criticalityScore: note.criticalityScore,
      model: note.model,
      purpose: note.purpose.observed[0] ?? note.purpose.inferred[0] ?? '',
      generatedAt: note.generatedAt,
    }))
    .sort((a, b) => b.criticalityScore - a.criticalityScore)

  const synthesizedFiles = notes.filter((n) => n.model !== 'static').length

  return {
    generatedAt: new Date().toISOString(),
    totalFiles: notes.length,
    synthesizedFiles,
    entries,
  }
}
