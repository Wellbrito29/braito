import { SCHEMA_VERSION } from '../types/schema-version.ts'
import type { NoteIndex } from './buildIndex.ts'
import type { RepoOverview, OverviewDomain, OverviewFile } from '../types/overview.ts'

const TOP_CRITICAL = 10
const TOP_ENTRY_POINTS = 8
const TOP_FILES_PER_DOMAIN = 3

export function buildOverview(
  index: NoteIndex,
  cycleCount: number,
): RepoOverview {
  const entries = index.entries

  const avgScore =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.criticalityScore, 0) / entries.length
      : 0

  // Domain breakdown
  const domainMap = new Map<string, typeof entries>()
  for (const e of entries) {
    if (!domainMap.has(e.domain)) domainMap.set(e.domain, [])
    domainMap.get(e.domain)!.push(e)
  }

  const domains: OverviewDomain[] = [...domainMap.entries()]
    .map(([name, files]) => ({
      name,
      fileCount: files.length,
      avgScore: parseFloat(
        (files.reduce((s, f) => s + f.criticalityScore, 0) / files.length).toFixed(2),
      ),
      topFiles: files
        .slice(0, TOP_FILES_PER_DOMAIN)
        .map((f) => ({ relativePath: f.relativePath, criticalityScore: f.criticalityScore, summary: f.summary })),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)

  // Critical files — top N by score
  const criticalFiles: OverviewFile[] = entries.slice(0, TOP_CRITICAL).map((e) => ({
    relativePath: e.relativePath,
    criticalityScore: e.criticalityScore,
    summary: e.summary,
    dependentCount: e.dependents.length,
  }))

  // Entry points — files with most dependents (widely consumed)
  const entryPoints: OverviewFile[] = [...entries]
    .filter((e) => e.dependents.length > 0)
    .sort((a, b) => b.dependents.length - a.dependents.length)
    .slice(0, TOP_ENTRY_POINTS)
    .map((e) => ({
      relativePath: e.relativePath,
      criticalityScore: e.criticalityScore,
      summary: e.summary,
      dependentCount: e.dependents.length,
    }))

  // Cyclic files — flagged in knownPitfalls via score heuristic; we use index stale flag as proxy
  // The actual cycle set is passed in via cycleCount (from detectCycles result length)
  const cyclicFiles: string[] = []

  const description = buildStaticDescription(index, domains, entryPoints)

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    model: 'static',
    description,
    stats: {
      totalFiles: index.totalFiles,
      synthesizedFiles: index.synthesizedFiles,
      avgCriticalityScore: parseFloat(avgScore.toFixed(2)),
      cycleCount,
    },
    domains,
    criticalFiles,
    entryPoints,
    cyclicFiles,
  }
}

function buildStaticDescription(
  index: NoteIndex,
  domains: OverviewDomain[],
  entryPoints: OverviewFile[],
): string {
  const parts: string[] = []

  parts.push(`Repository with ${index.totalFiles} files across ${domains.length} domain(s).`)

  if (domains.length > 0) {
    const topDomains = domains.slice(0, 3).map((d) => `${d.name} (${d.fileCount} files)`).join(', ')
    parts.push(`Main areas: ${topDomains}.`)
  }

  if (entryPoints.length > 0) {
    const top = entryPoints[0]
    parts.push(`Most consumed file: ${top.relativePath} (${top.dependentCount} dependents).`)
  }

  if (index.synthesizedFiles > 0) {
    parts.push(`${index.synthesizedFiles} of ${index.totalFiles} files have LLM-synthesized notes.`)
  }

  return parts.join(' ')
}
