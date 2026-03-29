import type { AiFileNote } from '../types/ai-note.ts'

export type NoteDiff = {
  filePath: string
  criticalityScoreDelta: number  // new - old
  fields: {
    [K in 'purpose' | 'invariants' | 'sensitiveDependencies' | 'importantDecisions' | 'knownPitfalls' | 'impactValidation']?: {
      added: string[]
      removed: string[]
    }
  }
}

export function diffNotes(oldNote: AiFileNote, newNote: AiFileNote): NoteDiff {
  const fields: NoteDiff['fields'] = {}
  const FIELD_KEYS = ['purpose', 'invariants', 'sensitiveDependencies', 'importantDecisions', 'knownPitfalls', 'impactValidation'] as const

  for (const key of FIELD_KEYS) {
    const oldItems = [...(oldNote[key].observed ?? []), ...(oldNote[key].inferred ?? [])]
    const newItems = [...(newNote[key].observed ?? []), ...(newNote[key].inferred ?? [])]
    const added = newItems.filter(i => !oldItems.includes(i))
    const removed = oldItems.filter(i => !newItems.includes(i))
    if (added.length > 0 || removed.length > 0) {
      fields[key] = { added, removed }
    }
  }

  return {
    filePath: newNote.filePath,
    criticalityScoreDelta: newNote.criticalityScore - oldNote.criticalityScore,
    fields,
  }
}

export function renderDiff(diffs: NoteDiff[]): string {
  if (diffs.length === 0) return 'No changes detected.'
  const lines: string[] = []
  for (const diff of diffs) {
    lines.push(`\n## ${diff.filePath}`)
    if (Math.abs(diff.criticalityScoreDelta) >= 0.01) {
      const sign = diff.criticalityScoreDelta > 0 ? '+' : ''
      lines.push(`  score: ${sign}${diff.criticalityScoreDelta.toFixed(2)}`)
    }
    for (const [field, changes] of Object.entries(diff.fields)) {
      if (!changes) continue
      lines.push(`  ${field}:`)
      for (const a of changes.added) lines.push(`    + ${a}`)
      for (const r of changes.removed) lines.push(`    - ${r}`)
    }
  }
  return lines.join('\n')
}
