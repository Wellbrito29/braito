import path from 'node:path'
import fs from 'node:fs/promises'

export type GraphNode = {
  path: string
  domain: string
  criticalityScore: number
}

export type GraphEdge = {
  from: string
  to: string
}

export type PersistedGraph = {
  generatedAt: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/**
 * Serializes the dependency graph to `.ai-notes/graph.json`.
 * Nodes carry domain and criticalityScore from the index entries for UI/query use.
 * Edges represent direct import relationships (from → to).
 */
export async function writeGraph(
  depGraph: Map<string, string[]>,
  nodeMetaMap: Map<string, { domain: string; criticalityScore: number }>,
  root: string,
  outputDir: string,
): Promise<void> {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (const [filePath, deps] of depGraph) {
    const rel = path.relative(root, filePath)
    const meta = nodeMetaMap.get(rel) ?? { domain: path.dirname(rel), criticalityScore: 0 }
    nodes.push({ path: rel, domain: meta.domain, criticalityScore: meta.criticalityScore })
    for (const dep of deps) {
      edges.push({ from: rel, to: path.relative(root, dep) })
    }
  }

  const graph: PersistedGraph = {
    generatedAt: new Date().toISOString(),
    nodes,
    edges,
  }

  const outDir = path.resolve(root, outputDir)
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.resolve(outDir, 'graph.json'), JSON.stringify(graph, null, 2), 'utf-8')
}
