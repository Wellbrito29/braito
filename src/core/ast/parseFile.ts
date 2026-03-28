import { Project } from 'ts-morph'
import type { StaticFileAnalysis } from '../types/file-analysis.ts'
import { extractImports } from './analyzers/ts/extractImports.ts'
import { extractExports } from './analyzers/ts/extractExports.ts'
import { extractSymbols } from './analyzers/ts/extractSymbols.ts'
import { extractHooks } from './analyzers/ts/extractHooks.ts'
import { extractComments } from './analyzers/ts/extractComments.ts'

const project = new Project({ skipAddingFilesFromTsConfig: true, useInMemoryFileSystem: false })

export function parseFile(filePath: string): StaticFileAnalysis {
  let sourceFile = project.getSourceFile(filePath)
  if (!sourceFile) {
    sourceFile = project.addSourceFileAtPath(filePath)
  }

  const imports = extractImports(sourceFile)
  const exports = extractExports(sourceFile)
  const symbols = extractSymbols(sourceFile)
  const hooks = extractHooks(sourceFile)
  const comments = extractComments(sourceFile)

  const hasSideEffects =
    imports.external.some((s) =>
      ['analytics', 'sentry', 'datadog', 'mixpanel', 'firebase'].some((kw) => s.includes(kw)),
    ) || comments.hack.length > 0

  return {
    filePath,
    imports: imports.all,
    localImports: imports.local,
    externalImports: imports.external,
    exports,
    symbols,
    hooks,
    envVars: extractEnvVars(sourceFile.getFullText()),
    apiCalls: extractApiCalls(sourceFile.getFullText()),
    comments,
    hasSideEffects,
  }
}

function extractEnvVars(text: string): string[] {
  const matches = text.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

function extractApiCalls(text: string): string[] {
  const matches = text.matchAll(/(?:fetch|axios|got|request)\s*\(\s*['"`]([^'"`]+)['"`]/g)
  return [...new Set([...matches].map((m) => m[1]))]
}
