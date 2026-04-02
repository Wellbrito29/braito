export type OverviewDomain = {
  name: string
  fileCount: number
  avgScore: number
  topFiles: Array<{ relativePath: string; criticalityScore: number; summary: string }>
}

export type OverviewFile = {
  relativePath: string
  criticalityScore: number
  summary: string
  dependentCount: number
}

export type RepoOverview = {
  schemaVersion: string
  generatedAt: string
  model: string
  description: string
  stats: {
    totalFiles: number
    synthesizedFiles: number
    avgCriticalityScore: number
    cycleCount: number
  }
  domains: OverviewDomain[]
  criticalFiles: OverviewFile[]
  entryPoints: OverviewFile[]
  cyclicFiles: string[]
}
