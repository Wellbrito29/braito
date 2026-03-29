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

  const lines = [
    `# AI Notes Index`,
    ``,
    `**Generated:** ${date} | **Total files:** ${index.totalFiles} | **LLM synthesized:** ${index.synthesizedFiles}`,
    ``,
    `## Files by Criticality`,
    ``,
    `| Score | File | Model | Purpose |`,
    `|-------|------|-------|---------|`,
  ]

  for (const entry of index.entries) {
    const score = entry.criticalityScore.toFixed(2)
    const link = `[${entry.relativePath}](./${entry.relativePath}.md)`
    const purpose = entry.purpose.replace(/\|/g, '\\|').slice(0, 80)
    lines.push(`| ${score} | ${link} | ${entry.model} | ${purpose} |`)
  }

  lines.push('')
  return lines.join('\n')
}
