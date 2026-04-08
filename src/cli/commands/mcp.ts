import path from 'node:path'
import fs from 'node:fs'
import { loadConfig } from '../../core/config/loadConfig.ts'

// ---------------------------------------------------------------------------
// MCP server — JSON-RPC 2.0 over stdio
// Exposes braito's .ai-notes/ sidecars as tools for AI assistants (Cursor, Claude)
// ---------------------------------------------------------------------------

export type JsonRpcRequest = {
  jsonrpc: '2.0'
  id: number | string | null
  method: string
  params?: unknown
}

export type JsonRpcResponse = {
  jsonrpc: '2.0'
  id: number | string | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

const TOOLS = [
  {
    name: 'get_file_note',
    description: 'Get the AI-generated note for a specific source file.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the source file, relative to the project root.',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'search_by_criticality',
    description: 'List files whose criticality score is at or above a threshold, sorted descending.',
    inputSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          description: 'Minimum criticality score (0–1). Default: 0.5',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results. Default: 20',
        },
      },
    },
  },
  {
    name: 'get_index',
    description: 'Get the full .ai-notes/index.json with all files ranked by criticality.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_architecture_context',
    description:
      'Get a synthesized architectural overview of the codebase — top critical files, domain breakdown, invariants, known pitfalls, and sensitive dependencies. Ideal as initial context before planning code changes or reviewing architecture.',
    inputSchema: {
      type: 'object',
      properties: {
        top_n: {
          type: 'number',
          description: 'Number of top critical files to include. Default: 10',
        },
      },
    },
  },
  {
    name: 'get_impact',
    description:
      'Get the blast radius of a file — which files directly or transitively depend on it, with their AI notes. Use this before making changes to understand what could break and review the logic of each dependent.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the source file, relative to the project root.',
        },
        depth: {
          type: 'number',
          description: 'How many levels of transitive dependents to include. Default: 2',
        },
        include_notes: {
          type: 'boolean',
          description: 'Include the full AI note for each dependent file. Default: false',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'search',
    description:
      'Full-text search across all AI notes fields (purpose, invariants, pitfalls, decisions, sensitiveDependencies). Returns matching files with relevant snippets.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for (case-insensitive).',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results. Default: 20',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_domain',
    description:
      'Get all files belonging to a specific domain (e.g. "src/core", "src/cli"), sorted by criticality score.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Domain name as it appears in the index (e.g. "src/core", "cli").',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'get_overview',
    description:
      'Get the repository-level overview — a high-level description of what the project does, its main domains, most critical files, and entry points. Read this first to orient yourself in a new codebase.',
    inputSchema: { type: 'object', properties: {} },
  },
]

function send(msg: JsonRpcResponse): void {
  process.stdout.write(JSON.stringify(msg) + '\n')
}

function errorResponse(id: number | string | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

/**
 * Handle a JSON-RPC request and return the response object.
 * Returns null for notification methods that require no response.
 * This function is exported for direct testing without subprocess overhead.
 */
export async function handleRequest(
  req: JsonRpcRequest,
  root: string,
  outputDir: string,
): Promise<JsonRpcResponse | null> {
  const { id, method, params } = req

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'braito', version: '1.0.0' },
      },
    }
  }

  if (method === 'notifications/initialized' || method === 'initialized') {
    // No response needed for notifications
    return null
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } }
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> }

    if (name === 'get_file_note') {
      const filePath = args.file_path as string
      const notesDir = path.resolve(root, outputDir)
      const notePath = path.resolve(notesDir, filePath + '.json')
      if (!path.normalize(notePath).startsWith(path.normalize(notesDir) + path.sep)) {
        return errorResponse(id, -32602, 'Invalid file path.')
      }
      if (!fs.existsSync(notePath)) {
        return errorResponse(id, -32602, `No note found for '${filePath}'. Run 'generate' first.`)
      }
      try {
        const note = JSON.parse(fs.readFileSync(notePath, 'utf-8'))
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(note, null, 2) }] } }
      } catch {
        return errorResponse(id, -32603, 'Failed to read note file.')
      }
    }

    if (name === 'search_by_criticality') {
      const threshold = (args.threshold as number | undefined) ?? 0.5
      const limit = (args.limit as number | undefined) ?? 20
      const indexPath = path.resolve(root, outputDir, 'index.json')
      if (!fs.existsSync(indexPath)) {
        return errorResponse(id, -32602, "Index not found. Run 'generate' first.")
      }
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        const results = index.entries
          .filter((e: { criticalityScore: number }) => e.criticalityScore >= threshold)
          .slice(0, limit)
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] } }
      } catch {
        return errorResponse(id, -32603, 'Failed to read index.')
      }
    }

    if (name === 'get_index') {
      const indexPath = path.resolve(root, outputDir, 'index.json')
      if (!fs.existsSync(indexPath)) {
        return errorResponse(id, -32602, "Index not found. Run 'generate' first.")
      }
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(index, null, 2) }] } }
      } catch {
        return errorResponse(id, -32603, 'Failed to read index.')
      }
    }

    if (name === 'get_architecture_context') {
      const topN = (args.top_n as number | undefined) ?? 10
      const indexPath = path.resolve(root, outputDir, 'index.json')
      if (!fs.existsSync(indexPath)) {
        return errorResponse(id, -32602, "Index not found. Run 'generate' first.")
      }
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

        // Top N critical files with enriched note data
        const topFiles = (index.entries as Array<{
          filePath: string
          criticalityScore: number
          domain: string
          stale?: boolean
        }>)
          .slice(0, topN)
          .map((entry) => {
            const notePath = path.resolve(root, outputDir, entry.filePath + '.json')
            let note: Record<string, unknown> = {}
            try { note = JSON.parse(fs.readFileSync(notePath, 'utf-8')) } catch { /* skip */ }
            type Field = { observed?: string[]; inferred?: string[] }
            const obs = (key: string): string[] => (note[key] as Field | undefined)?.observed ?? []
            return {
              filePath: entry.filePath,
              criticalityScore: entry.criticalityScore,
              domain: entry.domain,
              stale: entry.stale ?? false,
              purpose: obs('purpose')[0] ?? '',
              invariants: obs('invariants'),
              knownPitfalls: obs('knownPitfalls'),
              sensitiveDependencies: obs('sensitiveDependencies'),
              importantDecisions: obs('importantDecisions'),
            }
          })

        // Domain breakdown sorted by avg criticality
        const domainMap = new Map<string, { count: number; total: number }>()
        for (const entry of index.entries as Array<{ domain: string; criticalityScore: number }>) {
          const d = entry.domain ?? 'root'
          const s = domainMap.get(d) ?? { count: 0, total: 0 }
          s.count++
          s.total += entry.criticalityScore
          domainMap.set(d, s)
        }
        const domains = [...domainMap.entries()]
          .map(([name, s]) => ({ name, fileCount: s.count, avgCriticality: +(s.total / s.count).toFixed(2) }))
          .sort((a, b) => b.avgCriticality - a.avgCriticality)

        const entries = index.entries as Array<{ criticalityScore: number }>
        const context = {
          summary: {
            totalFiles: entries.length,
            staleNotes: index.staleFiles ?? 0,
            avgCriticality: +(entries.reduce((s, e) => s + e.criticalityScore, 0) / entries.length).toFixed(2),
            generatedAt: index.generatedAt,
          },
          domains,
          topCriticalFiles: topFiles,
        }

        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(context, null, 2) }] } }
      } catch {
        return errorResponse(id, -32603, 'Failed to build architecture context.')
      }
    }

    if (name === 'get_impact') {
      const filePath = args.file_path as string
      const depth = Math.min(Math.max(1, (args.depth as number | undefined) ?? 2), 10)
      const includeNotes = (args.include_notes as boolean | undefined) ?? false
      const indexPath = path.resolve(root, outputDir, 'index.json')
      const graphPath = path.resolve(root, outputDir, 'graph.json')
      if (!fs.existsSync(indexPath)) {
        return errorResponse(id, -32602, "Index not found. Run 'generate' first.")
      }
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        const entries = index.entries as Array<{ relativePath: string; criticalityScore: number; domain: string; dependents: string[] }>
        const entryMap = new Map(entries.map((e) => [e.relativePath, e]))

        // Build reverse adjacency from graph.json (full transitive) or fall back to index dependents
        const reverseAdj = new Map<string, string[]>()
        if (fs.existsSync(graphPath)) {
          type GraphEdge = { from: string; to: string }
          const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8')) as { edges: GraphEdge[] }
          for (const edge of graph.edges) {
            const rev = reverseAdj.get(edge.to) ?? []
            rev.push(edge.from)
            reverseAdj.set(edge.to, rev)
          }
        } else {
          // Fallback: index.dependents already maps file → "files that depend on it"
          for (const entry of entries) {
            reverseAdj.set(entry.relativePath, entry.dependents ?? [])
          }
        }

        // BFS traversal up to `depth` levels using full reverse adjacency
        const visited = new Set<string>()
        const levels: Array<{ relativePath: string; criticalityScore: number; domain: string; level: number; note?: unknown }> = []
        let frontier = [filePath]
        visited.add(filePath)

        for (let level = 1; level <= depth; level++) {
          const next: string[] = []
          for (const current of frontier) {
            for (const dependent of (reverseAdj.get(current) ?? [])) {
              if (!visited.has(dependent)) {
                visited.add(dependent)
                const depEntry = entryMap.get(dependent)
                const item: (typeof levels)[number] = {
                  relativePath: dependent,
                  criticalityScore: depEntry?.criticalityScore ?? 0,
                  domain: depEntry?.domain ?? path.dirname(dependent),
                  level,
                }
                if (includeNotes) {
                  const notePath = path.resolve(root, outputDir, dependent + '.json')
                  try { item.note = JSON.parse(fs.readFileSync(notePath, 'utf-8')) } catch { /* no note */ }
                }
                levels.push(item)
                next.push(dependent)
              }
            }
          }
          frontier = next
          if (frontier.length === 0) break
        }

        const graphSource = fs.existsSync(graphPath) ? 'graph.json' : 'index (shallow)'
        levels.sort((a, b) => a.level - b.level || b.criticalityScore - a.criticalityScore)
        const result = { file: filePath, totalAffected: levels.length, graphSource, dependents: levels }
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } }
      } catch {
        return errorResponse(id, -32603, 'Failed to compute impact.')
      }
    }

    if (name === 'search') {
      const query = (args.query as string).toLowerCase().trim()
      const limit = (args.limit as number | undefined) ?? 20
      if (!query) return errorResponse(id, -32602, 'query must not be empty.')
      const indexPath = path.resolve(root, outputDir, 'index.json')
      if (!fs.existsSync(indexPath)) {
        return errorResponse(id, -32602, "Index not found. Run 'generate' first.")
      }
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        const entries = index.entries as Array<{ relativePath: string; criticalityScore: number; domain: string }>
        const SEARCH_FIELDS = ['purpose', 'invariants', 'knownPitfalls', 'importantDecisions', 'sensitiveDependencies', 'impactValidation']

        const results: Array<{ relativePath: string; criticalityScore: number; domain: string; matches: Array<{ field: string; text: string }> }> = []

        for (const entry of entries) {
          const notePath = path.resolve(root, outputDir, entry.relativePath + '.json')
          const notesDir = path.resolve(root, outputDir)
          if (!path.normalize(notePath).startsWith(path.normalize(notesDir) + path.sep)) continue
          if (!fs.existsSync(notePath)) continue

          let note: Record<string, unknown>
          try { note = JSON.parse(fs.readFileSync(notePath, 'utf-8')) } catch { continue }

          const matches: Array<{ field: string; text: string }> = []
          type NoteField = { observed?: string[]; inferred?: string[] }

          for (const field of SEARCH_FIELDS) {
            const f = note[field] as NoteField | undefined
            if (!f) continue
            for (const text of [...(f.observed ?? []), ...(f.inferred ?? [])]) {
              if (text.toLowerCase().includes(query)) {
                matches.push({ field, text })
              }
            }
          }

          if (matches.length > 0) {
            results.push({ relativePath: entry.relativePath, criticalityScore: entry.criticalityScore, domain: entry.domain, matches })
          }

          if (results.length >= limit) break
        }

        results.sort((a, b) => b.criticalityScore - a.criticalityScore)
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify({ query, totalResults: results.length, results }, null, 2) }] } }
      } catch {
        return errorResponse(id, -32603, 'Failed to search notes.')
      }
    }

    if (name === 'get_domain') {
      const domain = (args.domain as string).trim()
      if (!domain) return errorResponse(id, -32602, 'domain must not be empty.')
      const indexPath = path.resolve(root, outputDir, 'index.json')
      if (!fs.existsSync(indexPath)) {
        return errorResponse(id, -32602, "Index not found. Run 'generate' first.")
      }
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        const entries = (index.entries as Array<{ relativePath: string; criticalityScore: number; domain: string; model: string; purpose: string; stale: boolean; dependents: string[] }>)
          .filter((e) => e.domain === domain)
          .sort((a, b) => b.criticalityScore - a.criticalityScore)

        if (entries.length === 0) {
          const domains = [...new Set((index.entries as Array<{ domain: string }>).map((e) => e.domain))].sort()
          return errorResponse(id, -32602, `Domain '${domain}' not found. Available: ${domains.join(', ')}`)
        }

        const avgCriticality = +(entries.reduce((s, e) => s + e.criticalityScore, 0) / entries.length).toFixed(2)
        const result = { domain, fileCount: entries.length, avgCriticality, files: entries }
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } }
      } catch {
        return errorResponse(id, -32603, 'Failed to get domain.')
      }
    }

    if (name === 'get_overview') {
      const overviewPath = path.resolve(root, outputDir, 'overview.json')
      if (!fs.existsSync(overviewPath)) {
        return errorResponse(id, -32602, "Overview not found. Run 'generate' first.")
      }
      try {
        const overview = fs.readFileSync(overviewPath, 'utf-8')
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: overview }] } }
      } catch {
        return errorResponse(id, -32603, 'Failed to read overview.')
      }
    }

    return errorResponse(id, -32601, `Unknown tool: ${name}`)
  }

  return errorResponse(id, -32601, `Method not found: ${method}`)
}

export async function runMcp(args: { root?: string; autoGenerate?: boolean }): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)
  const outputDir = config.output

  // Auto-generate notes if index doesn't exist and --auto-generate flag is set
  if (args.autoGenerate) {
    const indexPath = path.resolve(root, outputDir, 'index.json')
    if (!fs.existsSync(indexPath)) {
      process.stderr.write(`[braito] No notes found — running generate before starting MCP server...\n`)
      const { runGenerate } = await import('./generate.ts')
      await runGenerate({ root })
      process.stderr.write(`[braito] Generate complete. Starting MCP server.\n`)
    }
  }

  process.stderr.write(`braito MCP server started (root: ${root}, notes: ${outputDir})\n`)
  process.stderr.write(`Tools: get_overview | get_file_note | get_index | get_impact | search | get_domain | search_by_criticality\n`)

  let buffer = ''

  process.stdin.setEncoding('utf-8')
  process.stdin.on('data', async (chunk: string) => {
    buffer += chunk
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const req = JSON.parse(trimmed) as JsonRpcRequest
        const response = await handleRequest(req, root, outputDir)
        if (response !== null) {
          send(response)
        }
      } catch {
        send(errorResponse(null, -32700, 'Parse error'))
      }
    }
  })

  process.stdin.on('end', () => {
    process.exit(0)
  })
}
