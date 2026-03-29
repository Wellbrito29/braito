import path from 'node:path'
import fs from 'node:fs'
import { loadConfig } from '../../core/config/loadConfig.ts'

// ---------------------------------------------------------------------------
// MCP server — JSON-RPC 2.0 over stdio
// Exposes braito's .ai-notes/ sidecars as tools for AI assistants (Cursor, Claude)
// ---------------------------------------------------------------------------

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id: number | string | null
  method: string
  params?: unknown
}

type JsonRpcResponse = {
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
]

function send(msg: JsonRpcResponse): void {
  process.stdout.write(JSON.stringify(msg) + '\n')
}

function sendError(id: number | string | null, code: number, message: string): void {
  send({ jsonrpc: '2.0', id, error: { code, message } })
}

async function handleRequest(
  req: JsonRpcRequest,
  root: string,
  outputDir: string,
): Promise<void> {
  const { id, method, params } = req

  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'braito', version: '1.0.0' },
      },
    })
    return
  }

  if (method === 'notifications/initialized' || method === 'initialized') {
    // No response needed for notifications
    return
  }

  if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
    return
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> }

    if (name === 'get_file_note') {
      const filePath = args.file_path as string
      const notePath = path.resolve(root, outputDir, filePath + '.json')
      if (!fs.existsSync(notePath)) {
        sendError(id, -32602, `No note found for '${filePath}'. Run 'generate' first.`)
        return
      }
      try {
        const note = JSON.parse(fs.readFileSync(notePath, 'utf-8'))
        send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(note, null, 2) }] } })
      } catch {
        sendError(id, -32603, 'Failed to read note file.')
      }
      return
    }

    if (name === 'search_by_criticality') {
      const threshold = (args.threshold as number | undefined) ?? 0.5
      const limit = (args.limit as number | undefined) ?? 20
      const indexPath = path.resolve(root, outputDir, 'index.json')
      if (!fs.existsSync(indexPath)) {
        sendError(id, -32602, "Index not found. Run 'generate' first.")
        return
      }
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        const results = index.entries
          .filter((e: { criticalityScore: number }) => e.criticalityScore >= threshold)
          .slice(0, limit)
        send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] } })
      } catch {
        sendError(id, -32603, 'Failed to read index.')
      }
      return
    }

    if (name === 'get_index') {
      const indexPath = path.resolve(root, outputDir, 'index.json')
      if (!fs.existsSync(indexPath)) {
        sendError(id, -32602, "Index not found. Run 'generate' first.")
        return
      }
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(index, null, 2) }] } })
      } catch {
        sendError(id, -32603, 'Failed to read index.')
      }
      return
    }

    sendError(id, -32601, `Unknown tool: ${name}`)
    return
  }

  sendError(id, -32601, `Method not found: ${method}`)
}

export async function runMcp(args: { root?: string }): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)
  const outputDir = config.output

  process.stderr.write(`braito MCP server started (root: ${root}, notes: ${outputDir})\n`)

  // Read newline-delimited JSON from stdin
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
        await handleRequest(req, root, outputDir)
      } catch {
        sendError(null, -32700, 'Parse error')
      }
    }
  })

  process.stdin.on('end', () => {
    process.exit(0)
  })
}
