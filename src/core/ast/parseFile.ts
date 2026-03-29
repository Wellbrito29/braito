import path from 'node:path'
import fs from 'node:fs'
import { Project } from 'ts-morph'
import type { StaticFileAnalysis } from '../types/file-analysis.ts'
import { extractImports } from './analyzers/ts/extractImports.ts'
import { extractExports } from './analyzers/ts/extractExports.ts'
import { extractSymbols } from './analyzers/ts/extractSymbols.ts'
import { extractHooks } from './analyzers/ts/extractHooks.ts'
import { extractComments } from './analyzers/ts/extractComments.ts'
import { getAnalyzer } from './analyzerRegistry.ts'
import { logger } from '../utils/logger.ts'

const project = new Project({ skipAddingFilesFromTsConfig: true, useInMemoryFileSystem: false })

const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs'])

export function parseFile(filePath: string): StaticFileAnalysis {
  try {
    const ext = path.extname(filePath)

    // Delegate to language-specific analyzer if available
    const analyzer = getAnalyzer(ext)
    if (analyzer) {
      const content = fs.readFileSync(filePath, 'utf-8')
      return analyzer.analyze(filePath, content)
    }

    // Default: TypeScript/JavaScript via ts-morph
    if (!TS_EXTENSIONS.has(ext)) {
      // Unknown extension — return empty analysis rather than crashing
      return emptyAnalysis(filePath)
    }

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
  } catch (err) {
    logger.warn(`Failed to parse ${filePath}: ${(err as Error).message}`)
    return emptyAnalysis(filePath)
  }
}

function emptyAnalysis(filePath: string): StaticFileAnalysis {
  return {
    filePath,
    imports: [],
    localImports: [],
    externalImports: [],
    exports: [],
    symbols: [],
    hooks: [],
    envVars: [],
    apiCalls: [],
    comments: { todo: [], fixme: [], hack: [], invariant: [], decision: [] },
    hasSideEffects: false,
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

