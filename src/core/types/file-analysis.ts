export type StaticFileAnalysis = {
  filePath: string
  imports: string[]
  localImports: string[]
  externalImports: string[]
  exports: string[]
  symbols: string[]
  hooks: string[]
  envVars: string[]
  apiCalls: string[]
  comments: {
    todo: string[]
    fixme: string[]
    hack: string[]
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
}
