import type { LanguageAnalyzer } from '../../types.ts'
import type { StaticFileAnalysis } from '../../../types/file-analysis.ts'

export const pythonAnalyzer: LanguageAnalyzer = {
  extensions: ['.py'],
  analyze(filePath, content): StaticFileAnalysis {
    return {
      filePath,
      imports: extractImports(content),
      localImports: extractLocalImports(content),
      externalImports: extractExternalImports(content),
      exports: extractExports(content),
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
  // import x, import x as y
  for (const m of content.matchAll(/^import\s+([\w.]+)/gm)) imports.push(m[1])
  // from x import y
  for (const m of content.matchAll(/^from\s+([\w.]+)\s+import/gm)) imports.push(m[1])
  return [...new Set(imports)]
}

function extractLocalImports(content: string): string[] {
  const imports: string[] = []
  for (const m of content.matchAll(/^from\s+(\.[.\w]*)\s+import/gm)) imports.push(m[1])
  return [...new Set(imports)]
}

function extractExternalImports(content: string): string[] {
  return extractImports(content).filter((i) => !i.startsWith('.'))
}

function extractExports(content: string): string[] {
  // Public functions and classes (not prefixed with _)
  const exports: string[] = []
  for (const m of content.matchAll(/^(?:def|class|async def)\s+([A-Za-z][A-Za-z0-9_]*)/gm)) {
    exports.push(m[1])
  }
  return [...new Set(exports)]
}

function extractSymbols(content: string): string[] {
  const symbols: string[] = []
  for (const m of content.matchAll(/^(?:def|class|async def)\s+(\w+)/gm)) symbols.push(m[1])
  return [...new Set(symbols)]
}

function extractEnvVars(content: string): string[] {
  const vars: string[] = []
  for (const m of content.matchAll(/os\.environ(?:\.get)?\s*\[\s*['"]([A-Z_][A-Z0-9_]*)['"]|os\.getenv\s*\(\s*['"]([A-Z_][A-Z0-9_]*)['"]/g)) {
    vars.push(m[1] ?? m[2])
  }
  return [...new Set(vars)]
}

function extractApiCalls(content: string): string[] {
  const calls: string[] = []
  for (const m of content.matchAll(/(?:requests|httpx|aiohttp)\s*\.\s*(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g)) {
    calls.push(m[1])
  }
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
    if (/#+.*\bTODO\b/i.test(t)) todo.push(t.replace(/^#+\s*/, '').trim())
    else if (/#+.*\bFIXME\b/i.test(t)) fixme.push(t.replace(/^#+\s*/, '').trim())
    else if (/#+.*\bHACK\b/i.test(t)) hack.push(t.replace(/^#+\s*/, '').trim())
    else if (/#+.*\b(INVARIANT|CONTRACT|ASSERT|REQUIRES)\b/i.test(t)) invariant.push(t.replace(/^#+\s*/, '').trim())
    else if (/#+.*\b(NOTE|DECISION|WHY|REASON|RATIONALE)\b/i.test(t)) decision.push(t.replace(/^#+\s*/, '').trim())
  }

  return { todo, fixme, hack, invariant, decision }
}

function hasSideEffects(content: string): boolean {
  return /\b(sentry|datadog|mixpanel|firebase|analytics)\b/i.test(content)
}
