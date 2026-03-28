export function buildReverseDependencyGraph(
  graph: Map<string, string[]>,
): Map<string, string[]> {
  const reverse = new Map<string, string[]>()

  for (const [file, deps] of graph) {
    if (!reverse.has(file)) reverse.set(file, [])

    for (const dep of deps) {
      if (!reverse.has(dep)) reverse.set(dep, [])
      reverse.get(dep)!.push(file)
    }
  }

  return reverse
}
