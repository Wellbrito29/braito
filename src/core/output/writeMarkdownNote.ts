import path from 'node:path'
import fs from 'node:fs/promises'
import type { AiFileNote, StructuredListField } from '../types/ai-note.ts'

export async function writeMarkdownNote(
  note: AiFileNote,
  root: string,
  outputDir: string,
): Promise<string> {
  const relativePath = path.relative(root, note.filePath)
  const outputPath = path.resolve(root, outputDir, relativePath + '.md')
  const outputFolder = path.dirname(outputPath)

  await fs.mkdir(outputFolder, { recursive: true })
  await fs.writeFile(outputPath, renderMarkdown(note, relativePath), 'utf-8')

  return outputPath
}

function renderMarkdown(note: AiFileNote, relativePath: string): string {
  const date = new Date(note.generatedAt).toISOString().slice(0, 10)
  const score = note.criticalityScore.toFixed(2)

  const sections = [
    `# ${relativePath}`,
    ``,
    `**Criticality:** ${score} | **Generated:** ${date} | **Model:** ${note.model}`,
    ``,
    renderSection('Purpose', note.purpose),
    renderSection('Invariants', note.invariants),
    renderSection('Sensitive Dependencies', note.sensitiveDependencies),
    renderSection('Important Decisions', note.importantDecisions),
    renderSection('Known Pitfalls', note.knownPitfalls),
    renderSection('Impact Validation', note.impactValidation),
  ]

  return sections.filter((s) => s !== null).join('\n')
}

function renderSection(title: string, field: StructuredListField): string {
  const hasContent =
    field.observed.length > 0 ||
    field.inferred.length > 0 ||
    field.evidence.length > 0

  if (!hasContent) return ''

  const lines: string[] = [`## ${title}`, ``]

  if (field.observed.length > 0) {
    for (const item of field.observed) {
      lines.push(`- ${item}`)
    }
  }

  if (field.inferred.length > 0) {
    lines.push(``)
    lines.push(`> **Inferred** (confidence: ${field.confidence.toFixed(2)}):`)
    for (const item of field.inferred) {
      lines.push(`> - ${item}`)
    }
  }

  if (field.evidence.length > 0) {
    lines.push(``)
    lines.push(`| Type | Detail |`)
    lines.push(`|------|--------|`)
    for (const e of field.evidence) {
      const detail = e.detail.replace(/\|/g, '\\|')
      lines.push(`| ${e.type} | ${detail} |`)
    }
  }

  lines.push(``)
  return lines.join('\n')
}
