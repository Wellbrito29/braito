import path from 'node:path'
import fs from 'node:fs/promises'
import type { NoteIndex } from './buildIndex.ts'

export async function writeIndexNote(index: NoteIndex, root: string, outputDir: string): Promise<void> {
  const base = path.resolve(root, outputDir)
  await fs.mkdir(base, { recursive: true })

  await fs.writeFile(
    path.join(base, 'index.json'),
    JSON.stringify(index, null, 2),
    'utf-8',
  )

  await fs.writeFile(
    path.join(base, 'index.md'),
    renderIndexMarkdown(index),
    'utf-8',
  )
}

function renderIndexMarkdown(index: NoteIndex): string {
  const date = new Date(index.generatedAt).toISOString().slice(0, 10)

  const staleWarning = index.staleFiles > 0
    ? ` | **Stale notes:** ${index.staleFiles} (run \`generate --force\` to refresh)`
    : ''

  const lines = [
    `# AI Notes Index`,
    ``,
    `**Generated:** ${date} | **Total files:** ${index.totalFiles} | **LLM synthesized:** ${index.synthesizedFiles}${staleWarning}`,
    ``,
  ]

  // Group entries by domain, preserving criticality order within each group
  const groups = new Map<string, typeof index.entries>()
  for (const entry of index.entries) {
    const group = groups.get(entry.domain) ?? []
    group.push(entry)
    groups.set(entry.domain, group)
  }

  // Sort groups by the highest criticality score in each group
  const sortedGroups = [...groups.entries()].sort(
    ([, a], [, b]) => b[0].criticalityScore - a[0].criticalityScore,
  )

  for (const [domain, entries] of sortedGroups) {
    const avgScore = (entries.reduce((s, e) => s + e.criticalityScore, 0) / entries.length).toFixed(2)
    lines.push(`## ${domain}`)
    lines.push(``)
    lines.push(`_${entries.length} file${entries.length !== 1 ? 's' : ''} · avg criticality ${avgScore}_`)
    lines.push(``)
    lines.push(`| Score | File | Model | Purpose |`)
    lines.push(`|-------|------|-------|---------|`)

    for (const entry of entries) {
      const score = entry.criticalityScore.toFixed(2)
      const staleMarker = entry.stale ? ' ⚠' : ''
      const link = `[${entry.relativePath}](./${entry.relativePath}.md)`
      const purpose = entry.purpose.replace(/\|/g, '\\|').slice(0, 80)
      lines.push(`| ${score}${staleMarker} | ${link} | ${entry.model} | ${purpose} |`)
    }

    lines.push('')
  }

  return lines.join('\n')
}
