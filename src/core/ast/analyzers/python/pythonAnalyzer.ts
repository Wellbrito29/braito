import type { LanguageAnalyzer } from '../../types.ts'
import type { StaticFileAnalysis, ExportDetail } from '../../../types/file-analysis.ts'
import {
  buildApiCallRegex,
  extractApiCallUrls,
  hasSideEffectImport,
  resolveSideEffectPackages,
} from '../../detection.ts'

export const pythonAnalyzer: LanguageAnalyzer = {
  extensions: ['.py'],
  analyze(filePath, content, analysisConfig): StaticFileAnalysis {
    const allNames = extractAllPublicNames(content)
    const allowedNames = filterByDunderAll(content, allNames)
    const details = extractExportDetails(content, allowedNames)
    const externalImports = extractExternalImports(content)
    const sideEffectPackages = resolveSideEffectPackages(analysisConfig)
    const apiCallRegex = buildApiCallRegex(analysisConfig)
    return {
      filePath,
      imports: extractImports(content),
      localImports: extractLocalImports(content),
      externalImports,
      exports: allowedNames,
      exportDetails: details,
      symbols: extractSymbols(content),
      hooks: [],
      envVars: extractEnvVars(content),
      apiCalls: [
        ...extractApiCalls(content),
        ...(apiCallRegex ? extractApiCallUrls(content, apiCallRegex) : []),
      ].filter((v, i, arr) => arr.indexOf(v) === i),
      comments: extractComments(content),
      hasSideEffects:
        hasSideEffectImport(externalImports, sideEffectPackages) || hasSideEffects(content),
      signatures: details.map((d) => d.signature),
    }
  },
}

// ---------------------------------------------------------------------------
// Imports (with multiline support)
// ---------------------------------------------------------------------------

function extractImports(content: string): string[] {
  const imports: string[] = []
  // import x, import x as y
  for (const m of content.matchAll(/^import\s+([\w.]+)/gm)) imports.push(m[1])
  // from x import y (single-line)
  for (const m of content.matchAll(/^from\s+([\w.]+)\s+import\s+(?!\()/gm)) imports.push(m[1])
  // from x import ( ... ) (multiline)
  for (const m of content.matchAll(/^from\s+([\w.]+)\s+import\s*\(/gm)) imports.push(m[1])
  return [...new Set(imports)]
}

function extractLocalImports(content: string): string[] {
  const imports: string[] = []
  // Single-line relative
  for (const m of content.matchAll(/^from\s+(\.[.\w]*)\s+import\s+(?!\()/gm)) imports.push(m[1])
  // Multiline relative
  for (const m of content.matchAll(/^from\s+(\.[.\w]*)\s+import\s*\(/gm)) imports.push(m[1])
  return [...new Set(imports)]
}

function extractExternalImports(content: string): string[] {
  return extractImports(content).filter((i) => !i.startsWith('.'))
}

// ---------------------------------------------------------------------------
// Exports & __all__
// ---------------------------------------------------------------------------

/** Extract all public (non-underscore-prefixed) top-level function and class names */
function extractAllPublicNames(content: string): string[] {
  const names: string[] = []
  for (const m of content.matchAll(/^(?:def|class|async def)\s+([A-Za-z][A-Za-z0-9_]*)/gm)) {
    names.push(m[1])
  }
  return [...new Set(names)]
}

/** If __all__ is defined, restrict exports to only those names */
function filterByDunderAll(content: string, names: string[]): string[] {
  const allMatch = content.match(/__all__\s*=\s*\[([^\]]*)\]/)
  if (!allMatch) return names
  const allowed = new Set<string>()
  for (const m of allMatch[1].matchAll(/['"](\w+)['"]/g)) {
    allowed.add(m[1])
  }
  return names.filter((n) => allowed.has(n))
}

// ---------------------------------------------------------------------------
// Export details & signatures
// ---------------------------------------------------------------------------

function extractExportDetails(content: string, allowedNames: string[]): ExportDetail[] {
  const allowed = new Set(allowedNames)
  const details: ExportDetail[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // async def / def
    const funcMatch = line.match(/^(async\s+)?def\s+([A-Za-z]\w*)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?/)
    if (funcMatch) {
      const name = funcMatch[2]
      if (!allowed.has(name)) continue
      const isAsync = !!funcMatch[1]
      const params = funcMatch[3].trim()
      const returnType = funcMatch[4]?.trim() ?? ''
      const sig = returnType
        ? `${isAsync ? 'async ' : ''}def ${name}(${params}) -> ${returnType}`
        : `${isAsync ? 'async ' : ''}def ${name}(${params})`
      const docComment = extractDocstring(lines, i + 1)
      details.push({ name, signature: sig, kind: 'function', ...(docComment ? { docComment } : {}) })
      continue
    }

    // class
    const classMatch = line.match(/^class\s+([A-Za-z]\w*)(?:\(([^)]*)\))?/)
    if (classMatch) {
      const name = classMatch[1]
      if (!allowed.has(name)) continue
      const bases = classMatch[2]?.trim() ?? ''
      const sig = bases ? `class ${name}(${bases})` : `class ${name}`
      const docComment = extractDocstring(lines, i + 1)
      details.push({ name, signature: sig, kind: 'class', ...(docComment ? { docComment } : {}) })
    }
  }

  return details
}

/** Extract the first line of a docstring (""" or ''') if it appears right after a def/class */
function extractDocstring(lines: string[], startIdx: number): string | undefined {
  for (let i = startIdx; i < Math.min(startIdx + 3, lines.length); i++) {
    const t = lines[i].trim()
    if (!t) continue
    // Single-line docstring: """text""" or '''text'''
    const singleLine = t.match(/^(?:"""|''')(.+?)(?:"""|''')/)
    if (singleLine) return singleLine[1].trim()
    // Multi-line docstring opening
    const opening = t.match(/^(?:"""|''')(.*)/)
    if (opening) return opening[1].trim() || undefined
    break
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Symbols
// ---------------------------------------------------------------------------

function extractSymbols(content: string): string[] {
  const symbols: string[] = []
  for (const m of content.matchAll(/^(?:def|class|async def)\s+(\w+)/gm)) symbols.push(m[1])
  return [...new Set(symbols)]
}

// ---------------------------------------------------------------------------
// Env vars / API calls / Comments / Side effects
// ---------------------------------------------------------------------------

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
    else if (/#+.*\b(INVARIANT|CONTRACT|ASSERT|REQUIRES|ENSURES)\b/i.test(t)) invariant.push(t.replace(/^#+\s*/, '').trim())
    else if (/#+.*\b(NOTE|DECISION|WHY|REASON|RATIONALE|ADR)\b/i.test(t)) decision.push(t.replace(/^#+\s*/, '').trim())
  }

  return { todo, fixme, hack, invariant, decision }
}

function hasSideEffects(content: string): boolean {
  return /\b(sentry|datadog|mixpanel|firebase|analytics)\b/i.test(content)
}
