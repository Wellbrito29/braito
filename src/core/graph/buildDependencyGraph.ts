import type { StaticFileAnalysis } from '../types/file-analysis.ts'
import { resolveImportPath } from './resolveImportPath.ts'

type PathAliases = Record<string, string[]>

export function buildDependencyGraph(
  analyses: StaticFileAnalysis[],
  root: string,
  aliases: PathAliases = {},
): Map<string, string[]> {
  const graph = new Map<string, string[]>()

  for (const analysis of analyses) {
    graph.set(analysis.filePath, resolveFileDeps(analysis, root, aliases))
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
  graph.set(analysis.filePath, resolveFileDeps(analysis, root, aliases))
}

function resolveFileDeps(
  analysis: StaticFileAnalysis,
  root: string,
  aliases: PathAliases,
): string[] {
  const deps: string[] = []
  for (const importSpecifier of analysis.localImports) {
    const resolved = resolveImportPath(importSpecifier, analysis.filePath, root, aliases)
    if (resolved) deps.push(resolved)
  }
  return deps
}
