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
    const deps: string[] = []

    for (const importSpecifier of analysis.localImports) {
      const resolved = resolveImportPath(importSpecifier, analysis.filePath, root, aliases)
      if (resolved) deps.push(resolved)
    }

    graph.set(analysis.filePath, deps)
  }

  return graph
}
