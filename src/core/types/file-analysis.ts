export type ExportDetail = {
  name: string
  signature: string
  kind: 'function' | 'class' | 'type' | 'variable' | 'enum'
  docComment?: string
}

export type StaticFileAnalysis = {
  filePath: string
  imports: string[]
  localImports: string[]
  externalImports: string[]
  exports: string[]
  exportDetails: ExportDetail[]
  symbols: string[]
  hooks: string[]
  envVars: string[]
  apiCalls: string[]
  comments: {
    todo: string[]
    fixme: string[]
    hack: string[]
    invariant: string[]
    decision: string[]
  }
  hasSideEffects: boolean
}

export type GraphSignals = {
  filePath: string
  directDependencies: string[]
  reverseDependencies: string[]
}

export type TestSignals = {
  filePath: string
  relatedTests: string[]
  coveragePct?: number  // 0–1 from lcov/c8 report; undefined if no report available
}

export type GitCommitEntry = {
  hash: string
  date: string    // ISO 8601
  message: string
  author: string
}

export type GitSignals = {
  filePath: string
  churnScore: number
  recentCommitMessages: string[]
  recentCommits: GitCommitEntry[]
  coChangedFiles: Array<{ path: string; count: number }>
  authorCount: number
}
