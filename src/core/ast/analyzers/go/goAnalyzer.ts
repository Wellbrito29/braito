import path from 'node:path'
import fs from 'node:fs'
import type { LanguageAnalyzer } from '../../types.ts'
import type { StaticFileAnalysis } from '../../../types/file-analysis.ts'

/**
 * Walk up the directory tree from filePath to find the nearest go.mod file.
 * Returns the module name declared in "module <name>" or null if not found.
 */
export function getGoModuleName(filePath: string): string | null {
  let dir = path.dirname(path.resolve(filePath))
  const root = path.parse(dir).root

  while (dir !== root) {
    const goModPath = path.join(dir, 'go.mod')
    if (fs.existsSync(goModPath)) {
      try {
        const content = fs.readFileSync(goModPath, 'utf8')
        const match = content.match(/^module\s+(\S+)/m)
        if (match) return match[1]
      } catch {
        // ignore read errors
      }
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export const goAnalyzer: LanguageAnalyzer = {
  extensions: ['.go'],
  analyze(filePath, content): StaticFileAnalysis {
    return {
      filePath,
      imports: extractImports(content),
      localImports: extractLocalImports(filePath, content),
      externalImports: extractExternalImports(filePath, content),
      exports: extractExports(content),
      exportDetails: [],
      symbols: extractSymbols(content),
      hooks: [],
      envVars: extractEnvVars(content),
      apiCalls: extractApiCalls(content),
      comments: extractComments(content),
      hasSideEffects: hasSideEffects(content),
    }
  },
}

function extractImports(content: string): string[] {
  const imports: string[] = []
  // Single: import "pkg"
  for (const m of content.matchAll(/^import\s+"([^"]+)"/gm)) imports.push(m[1])
  // Block: import ( "pkg" ... )
  const blockMatch = content.match(/import\s*\(([\s\S]*?)\)/)
  if (blockMatch) {
    for (const m of blockMatch[1].matchAll(/"([^"]+)"/g)) imports.push(m[1])
  }
  return [...new Set(imports)]
}

function extractLocalImports(filePath: string, content: string): string[] {
  // Go local imports use module-relative paths (e.g. "github.com/org/repo/pkg/util").
  // Look up go.mod to get the module name and match against it.
  // Fall back to ./ and ../ heuristics if go.mod is not found.
  const moduleName = getGoModuleName(filePath)
  const allImports = extractImports(content)
  if (moduleName) {
    return allImports.filter((imp) => imp.startsWith(moduleName + '/') || imp === moduleName)
  }
  return allImports.filter((imp) => imp.startsWith('./') || imp.startsWith('../'))
}

function extractExternalImports(filePath: string, content: string): string[] {
  const moduleName = getGoModuleName(filePath)
  const allImports = extractImports(content)
  if (moduleName) {
    return allImports.filter((imp) => !imp.startsWith(moduleName + '/') && imp !== moduleName)
  }
  return allImports.filter((imp) => !imp.startsWith('./') && !imp.startsWith('../'))
}

function extractExports(content: string): string[] {
  // Exported identifiers start with uppercase
  const exports: string[] = []
  for (const m of content.matchAll(/^func\s+([A-Z][A-Za-z0-9]*)\s*[(\[]/gm)) exports.push(m[1])
  for (const m of content.matchAll(/^type\s+([A-Z][A-Za-z0-9]*)\s+/gm)) exports.push(m[1])
  for (const m of content.matchAll(/^var\s+([A-Z][A-Za-z0-9]*)\s+/gm)) exports.push(m[1])
  for (const m of content.matchAll(/^const\s+([A-Z][A-Za-z0-9]*)\s+/gm)) exports.push(m[1])
  return [...new Set(exports)]
}

function extractSymbols(content: string): string[] {
  const symbols: string[] = []
  for (const m of content.matchAll(/^func\s+(?:\([^)]+\)\s+)?(\w+)\s*[(\[]/gm)) symbols.push(m[1])
  for (const m of content.matchAll(/^type\s+(\w+)\s+/gm)) symbols.push(m[1])
  return [...new Set(symbols)]
}

function extractEnvVars(content: string): string[] {
  const vars: string[] = []
  for (const m of content.matchAll(/os\.Getenv\s*\(\s*"([A-Z_][A-Z0-9_]*)"/g)) vars.push(m[1])
  for (const m of content.matchAll(/os\.LookupEnv\s*\(\s*"([A-Z_][A-Z0-9_]*)"/g)) vars.push(m[1])
  return [...new Set(vars)]
}

function extractApiCalls(content: string): string[] {
  const calls: string[] = []
  for (const m of content.matchAll(/http\.(?:Get|Post|Put|Delete)\s*\(\s*"([^"]+)"/g)) calls.push(m[1])
  return [...new Set(calls)]
}

function extractComments(content: string) {
  const todo: string[] = []
  const fixme: string[] = []
  const hack: string[] = []
  const invariant: string[] = []
  const decision: string[] = []

  for (const line of content.split('\n')) {
    const t = line.trim()
    if (/\/\/.*\bTODO\b/i.test(t)) todo.push(t.replace(/^\/\/\s*/, '').trim())
    else if (/\/\/.*\bFIXME\b/i.test(t)) fixme.push(t.replace(/^\/\/\s*/, '').trim())
    else if (/\/\/.*\bHACK\b/i.test(t)) hack.push(t.replace(/^\/\/\s*/, '').trim())
    else if (/\/\/.*\b(INVARIANT|CONTRACT|ASSERT|REQUIRES)\b/i.test(t)) invariant.push(t.replace(/^\/\/\s*/, '').trim())
    else if (/\/\/.*\b(NOTE|DECISION|WHY|REASON|RATIONALE)\b/i.test(t)) decision.push(t.replace(/^\/\/\s*/, '').trim())
  }

  return { todo, fixme, hack, invariant, decision }
}

function hasSideEffects(content: string): boolean {
  return /\b(sentry|datadog|mixpanel|firebase|analytics)\b/i.test(content)
}
