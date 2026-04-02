import path from 'node:path'
import fs from 'node:fs/promises'
import type { RepoOverview } from '../types/overview.ts'

export async function writeOverview(
  overview: RepoOverview,
  root: string,
  outputDir: string,
): Promise<void> {
  const dir = path.resolve(root, outputDir)
  await fs.mkdir(dir, { recursive: true })

  await fs.writeFile(path.join(dir, 'overview.json'), JSON.stringify(overview, null, 2), 'utf-8')
  await fs.writeFile(path.join(dir, 'overview.md'), renderOverviewMarkdown(overview), 'utf-8')
}

function renderOverviewMarkdown(overview: RepoOverview): string {
  const date = new Date(overview.generatedAt).toISOString().slice(0, 10)
  const lines: string[] = []

  lines.push(`# Repository Overview`)
  lines.push(``)
  lines.push(`**Generated:** ${date} | **Model:** ${overview.model} | **Files:** ${overview.stats.totalFiles}`)
  lines.push(``)
  lines.push(`> ${overview.description}`)
  lines.push(``)

  // Stats
  lines.push(`## Stats`)
  lines.push(``)
  lines.push(`| Metric | Value |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Total files | ${overview.stats.totalFiles} |`)
  lines.push(`| LLM-synthesized | ${overview.stats.synthesizedFiles} |`)
  lines.push(`| Avg criticality | ${overview.stats.avgCriticalityScore} |`)
  lines.push(`| Circular import cycles | ${overview.stats.cycleCount} |`)
  lines.push(``)

  // Domains
  lines.push(`## Domains`)
  lines.push(``)
  lines.push(`| Domain | Files | Avg Score |`)
  lines.push(`|--------|-------|-----------|`)
  for (const d of overview.domains) {
    lines.push(`| ${d.name} | ${d.fileCount} | ${d.avgScore} |`)
  }
  lines.push(``)

  // Critical files
  if (overview.criticalFiles.length > 0) {
    lines.push(`## Most Critical Files`)
    lines.push(``)
    lines.push(`| Score | File | Summary |`)
    lines.push(`|-------|------|---------|`)
    for (const f of overview.criticalFiles) {
      const summary = f.summary.replace(/\|/g, '\\|').slice(0, 80)
      lines.push(`| ${f.criticalityScore.toFixed(2)} | ${f.relativePath} | ${summary} |`)
    }
    lines.push(``)
  }

  // Entry points
  if (overview.entryPoints.length > 0) {
    lines.push(`## Entry Points`)
    lines.push(``)
    lines.push(`| Dependents | File | Summary |`)
    lines.push(`|------------|------|---------|`)
    for (const f of overview.entryPoints) {
      const summary = f.summary.replace(/\|/g, '\\|').slice(0, 80)
      lines.push(`| ${f.dependentCount} | ${f.relativePath} | ${summary} |`)
    }
    lines.push(``)
  }

  return lines.join('\n')
}
