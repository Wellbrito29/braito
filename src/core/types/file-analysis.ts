export type StaticFileAnalysis = {
  filePath: string
  imports: string[]
  localImports: string[]
  externalImports: string[]
  exports: string[]
  symbols: string[]
  signatures: string[]
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

export type GitSignals = {
  filePath: string
  churnScore: number
  recentCommitMessages: string[]
  coChangedFiles: Array<{ path: string; count: number }>
  authorCount: number
}
