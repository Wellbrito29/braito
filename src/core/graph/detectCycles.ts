/**
 * Returns all cycles in the dependency graph using DFS.
 * Each cycle is represented as an array of file paths forming the loop.
 */
export function detectCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const inStack = new Set<string>()
  const path: string[] = []

  function dfs(node: string): void {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node)
      cycles.push(path.slice(cycleStart))
      return
    }
    if (visited.has(node)) return
    visited.add(node)
    inStack.add(node)
    path.push(node)
    for (const dep of graph.get(node) ?? []) {
      dfs(dep)
    }
    path.pop()
    inStack.delete(node)
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs(node)
  }
  return cycles
}

/** Returns the set of file paths that participate in at least one cycle */
export function filesInCycles(cycles: string[][]): Set<string> {
  return new Set(cycles.flat())
}
