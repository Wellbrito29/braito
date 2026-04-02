import type { RepoOverview } from '../../types/overview.ts'

export function buildOverviewPrompt(overview: RepoOverview): string {
  const domainSummary = overview.domains
    .map((d) => `- ${d.name}: ${d.fileCount} files, avg score ${d.avgScore}`)
    .join('\n')

  const criticalSummary = overview.criticalFiles
    .slice(0, 8)
    .map((f) => `- ${f.relativePath} (score: ${f.criticalityScore}, ${f.dependentCount} dependents): ${f.summary}`)
    .join('\n')

  const entryPointSummary = overview.entryPoints
    .slice(0, 5)
    .map((f) => `- ${f.relativePath} (${f.dependentCount} dependents): ${f.summary}`)
    .join('\n')

  return `You are analyzing a software repository. Based on the structural data below, write a concise repository overview.

Stats:
- Total files: ${overview.stats.totalFiles}
- Domains: ${overview.domains.length}
- Avg criticality: ${overview.stats.avgCriticalityScore}
- Circular import cycles: ${overview.stats.cycleCount}

Domain breakdown:
${domainSummary}

Most critical files:
${criticalSummary}

Most consumed files (entry points):
${entryPointSummary || 'none detected'}

Return a JSON object with a single field:
{
  "description": "3-5 sentence overview of what this repository does, its main architectural areas, key patterns, and any notable risks. Be specific and technical — mention actual domain names and file roles. Do not be generic."
}

Return ONLY the JSON object.`
}
