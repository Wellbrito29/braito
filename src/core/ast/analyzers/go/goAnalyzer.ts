import path from 'node:path'
import fs from 'node:fs'
import type { LanguageAnalyzer } from '../../types.ts'
import type { StaticFileAnalysis, ExportDetail } from '../../../types/file-analysis.ts'
import {
  buildApiCallRegex,
  extractApiCallUrls,
  hasSideEffectImport,
  resolveSideEffectPackages,
} from '../../detection.ts'

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
  analyze(filePath, content, analysisConfig): StaticFileAnalysis {
    const details = extractExportDetails(content)
    const externalImports = extractExternalImports(filePath, content)
    const sideEffectPackages = resolveSideEffectPackages(analysisConfig)
    const apiCallRegex = buildApiCallRegex(analysisConfig)
    return {
      filePath,
      imports: extractImports(content),
      localImports: extractLocalImports(filePath, content),
      externalImports,
      exports: extractExports(content),
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
// Imports
// ---------------------------------------------------------------------------

function extractImports(content: string): string[] {
  const imports: string[] = []
  for (const m of content.matchAll(/^import\s+"([^"]+)"/gm)) imports.push(m[1])
  const blockMatch = content.match(/import\s*\(([\s\S]*?)\)/)
  if (blockMatch) {
    for (const m of blockMatch[1].matchAll(/"([^"]+)"/g)) imports.push(m[1])
  }
  return [...new Set(imports)]
}

function extractLocalImports(filePath: string, content: string): string[] {
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

// ---------------------------------------------------------------------------
// Exports — includes methods with receivers
// ---------------------------------------------------------------------------

function extractExports(content: string): string[] {
  const exports: string[] = []
  for (const m of content.matchAll(/^func\s+(?:\([^)]+\)\s+)?([A-Z][A-Za-z0-9]*)\s*[(\[]/gm)) exports.push(m[1])
  for (const m of content.matchAll(/^type\s+([A-Z][A-Za-z0-9]*)\s+/gm)) exports.push(m[1])
  for (const m of content.matchAll(/^var\s+([A-Z][A-Za-z0-9]*)\s+/gm)) exports.push(m[1])
  for (const m of content.matchAll(/^const\s+([A-Z][A-Za-z0-9]*)\s+/gm)) exports.push(m[1])
  return [...new Set(exports)]
}

// ---------------------------------------------------------------------------
// Export details & signatures
// ---------------------------------------------------------------------------

function extractExportDetails(content: string): ExportDetail[] {
  const details: ExportDetail[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const funcMatch = line.match(/^func\s+(\([^)]+\)\s+)?([A-Z][A-Za-z0-9]*)\s*\(([^)]*)\)(?:\s*(?:\(([^)]*)\)|(\S+)))?/)
    if (funcMatch) {
      const receiver = funcMatch[1]?.trim() ?? ''
      const name = funcMatch[2]
      const params = funcMatch[3].trim()
      const multiReturn = funcMatch[4]?.trim()
      const singleReturn = funcMatch[5]?.trim()
      const returnPart = multiReturn ? ` (${multiReturn})` : singleReturn ? ` ${singleReturn}` : ''
      const receiverPart = receiver ? `func ${receiver} ${name}(${params})${returnPart}` : `func ${name}(${params})${returnPart}`
      details.push({ name, signature: receiverPart, kind: 'function' })
      continue
    }

    const structMatch = line.match(/^type\s+([A-Z][A-Za-z0-9]*)\s+struct\s*\{/)
    if (structMatch) {
      const name = structMatch[1]
      const fields = extractStructFields(lines, i + 1, 6)
      const sig = fields.length > 0
        ? `type ${name} struct { ${fields.join('; ')} }`
        : `type ${name} struct`
      details.push({ name, signature: sig, kind: 'type' })
      continue
    }

    const ifaceMatch = line.match(/^type\s+([A-Z][A-Za-z0-9]*)\s+interface\s*\{/)
    if (ifaceMatch) {
      const name = ifaceMatch[1]
      const methods = extractInterfaceMethods(lines, i + 1, 6)
      const sig = methods.length > 0
        ? `type ${name} interface { ${methods.join('; ')} }`
        : `type ${name} interface`
      details.push({ name, signature: sig, kind: 'type' })
      continue
    }

    const typeMatch = line.match(/^type\s+([A-Z][A-Za-z0-9]*)\s+(\S.*)/)
    if (typeMatch && !typeMatch[2].startsWith('struct') && !typeMatch[2].startsWith('interface')) {
      const name = typeMatch[1]
      const rest = typeMatch[2].trim()
      details.push({ name, signature: `type ${name} ${rest}`, kind: 'type' })
    }
  }

  return details
}

function extractStructFields(lines: string[], startIdx: number, maxFields: number): string[] {
  const fields: string[] = []
  for (let i = startIdx; i < lines.length && fields.length < maxFields; i++) {
    const t = lines[i].trim()
    if (t === '}' || t.startsWith('}')) break
    if (!t || t.startsWith('//') || t.startsWith('/*')) continue
    const fieldMatch = t.match(/^(\w+)\s+(\S+)/)
    if (fieldMatch) {
      fields.push(`${fieldMatch[1]} ${fieldMatch[2]}`)
    }
  }
  return fields
}

function extractInterfaceMethods(lines: string[], startIdx: number, maxMethods: number): string[] {
  const methods: string[] = []
  for (let i = startIdx; i < lines.length && methods.length < maxMethods; i++) {
    const t = lines[i].trim()
    if (t === '}' || t.startsWith('}')) break
    if (!t || t.startsWith('//') || t.startsWith('/*')) continue
    const methodMatch = t.match(/^([A-Z]\w*)\s*\(/)
    if (methodMatch) {
      methods.push(t)
    }
  }
  return methods
}

// ---------------------------------------------------------------------------
// Symbols
// ---------------------------------------------------------------------------

function extractSymbols(content: string): string[] {
  const symbols: string[] = []
  for (const m of content.matchAll(/^func\s+(?:\([^)]+\)\s+)?(\w+)\s*[(\[]/gm)) symbols.push(m[1])
  for (const m of content.matchAll(/^type\s+(\w+)\s+/gm)) symbols.push(m[1])
  return [...new Set(symbols)]
}

// ---------------------------------------------------------------------------
// Env vars / API calls / Comments / Side effects
// ---------------------------------------------------------------------------

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
    else if (/\/\/.*\b(INVARIANT|CONTRACT|ASSERT|REQUIRES|ENSURES)\b/i.test(t)) invariant.push(t.replace(/^\/\/\s*/, '').trim())
    else if (/\/\/.*\b(NOTE|DECISION|WHY|REASON|RATIONALE|ADR)\b/i.test(t)) decision.push(t.replace(/^\/\/\s*/, '').trim())
  }

  return { todo, fixme, hack, invariant, decision }
}

function hasSideEffects(content: string): boolean {
  return /\b(sentry|datadog|mixpanel|firebase|analytics)\b/i.test(content)
}
