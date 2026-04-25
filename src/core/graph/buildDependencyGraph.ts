import path from 'node:path'
import fs from 'node:fs'
import type { StaticFileAnalysis } from '../types/file-analysis.ts'
import { resolveImportPath } from './resolveImportPath.ts'

type PathAliases = Record<string, string[]>

/**
 * Reads `<root>/go.mod` if present and returns the declared module path
 * (e.g. "rd-autonomous-team"). Returns null when no go.mod exists at the
 * root or when the file is malformed. Only the root-level go.mod is
 * consulted; for monorepos with multiple modules, the analyzer's own
 * per-file walker still catches them at the analysis layer.
 */
function readRootGoModulePath(root: string): string | null {
  const goModPath = path.join(root, 'go.mod')
  if (!fs.existsSync(goModPath)) return null
  try {
    const content = fs.readFileSync(goModPath, 'utf8')
    const match = content.match(/^module\s+(\S+)/m)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export function buildDependencyGraph(
  analyses: StaticFileAnalysis[],
  root: string,
  aliases: PathAliases = {},
): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  const goModulePath = readRootGoModulePath(root)
  const opts = { aliases, goModulePath: goModulePath ?? undefined }

  for (const analysis of analyses) {
    graph.set(analysis.filePath, resolveFileDeps(analysis, root, opts))
  }

  return graph
}

/**
 * Updates a single file's entry in an existing dependency graph.
 * All other entries remain untouched, making watch-mode rebuilds O(1) per change.
 */
export function updateDependencyGraph(
  graph: Map<string, string[]>,
  analysis: StaticFileAnalysis,
  root: string,
  aliases: PathAliases = {},
): void {
  const goModulePath = readRootGoModulePath(root)
  const opts = { aliases, goModulePath: goModulePath ?? undefined }
  graph.set(analysis.filePath, resolveFileDeps(analysis, root, opts))
}

function resolveFileDeps(
  analysis: StaticFileAnalysis,
  root: string,
  opts: { aliases: PathAliases; goModulePath?: string },
): string[] {
  const deps: string[] = []
  for (const importSpecifier of analysis.localImports) {
    const resolved = resolveImportPath(importSpecifier, analysis.filePath, root, opts)
    if (resolved) deps.push(resolved)
  }
  return deps
}
