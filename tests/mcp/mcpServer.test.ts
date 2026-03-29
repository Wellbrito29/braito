import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

// We test the MCP handler logic directly by importing and calling handleRequest
// via the exported runMcp internals — but since handleRequest is not exported,
// we test the JSON-RPC protocol by spawning the MCP server as a subprocess.

let tmpDir: string
let notesDir: string

const MOCK_NOTE = {
  filePath: '/project/src/a.ts',
  purpose: { observed: ['Exports: foo'], inferred: [], confidence: 0.6, evidence: [] },
  invariants: { observed: [], inferred: [], confidence: 0, evidence: [] },
  sensitiveDependencies: { observed: [], inferred: [], confidence: 0, evidence: [] },
  importantDecisions: { observed: [], inferred: [], confidence: 0, evidence: [] },
  knownPitfalls: { observed: [], inferred: [], confidence: 0, evidence: [] },
  impactValidation: { observed: [], inferred: [], confidence: 0, evidence: [] },
  criticalityScore: 0.7,
  generatedAt: new Date().toISOString(),
  model: 'static',
}

const MOCK_INDEX = {
  generatedAt: new Date().toISOString(),
  totalFiles: 1,
  synthesizedFiles: 0,
  staleFiles: 0,
  entries: [
    {
      filePath: '/project/src/a.ts',
      relativePath: 'src/a.ts',
      domain: 'src',
      criticalityScore: 0.7,
      model: 'static',
      purpose: 'Exports: foo',
      generatedAt: MOCK_NOTE.generatedAt,
      stale: false,
    },
  ],
}

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-mcp-test-'))
  notesDir = path.join(tmpDir, '.ai-notes', 'src')
  fs.mkdirSync(notesDir, { recursive: true })
  fs.writeFileSync(path.join(notesDir, 'a.ts.json'), JSON.stringify(MOCK_NOTE))
  fs.writeFileSync(path.join(tmpDir, '.ai-notes', 'index.json'), JSON.stringify(MOCK_INDEX))
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

async function sendMcpRequest(input: string): Promise<unknown[]> {
  const proc = Bun.spawn(
    ['bun', path.resolve(import.meta.dir, '../../src/cli/index.ts'), 'mcp', '--root', tmpDir],
    {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  proc.stdin.write(input + '\n')
  proc.stdin.end()

  const output = await new Response(proc.stdout).text()
  const lines = output.trim().split('\n').filter(Boolean)
  return lines.map((l) => JSON.parse(l))
}

describe('MCP server', () => {
  it('responds to initialize with server info', async () => {
    const responses = await sendMcpRequest(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    )
    const init = responses.find((r: any) => r.id === 1) as any
    expect(init.result.serverInfo.name).toBe('braito')
    expect(init.result.capabilities.tools).toBeDefined()
  })

  it('lists available tools', async () => {
    const responses = await sendMcpRequest(
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    )
    const res = responses.find((r: any) => r.id === 2) as any
    const names = res.result.tools.map((t: any) => t.name)
    expect(names).toContain('get_file_note')
    expect(names).toContain('search_by_criticality')
    expect(names).toContain('get_index')
  })

  it('get_file_note returns note content', async () => {
    const responses = await sendMcpRequest(
      JSON.stringify({
        jsonrpc: '2.0', id: 3, method: 'tools/call',
        params: { name: 'get_file_note', arguments: { file_path: 'src/a.ts' } },
      }),
    )
    const res = responses.find((r: any) => r.id === 3) as any
    const note = JSON.parse(res.result.content[0].text)
    expect(note.criticalityScore).toBe(0.7)
  })

  it('get_file_note returns error for missing file', async () => {
    const responses = await sendMcpRequest(
      JSON.stringify({
        jsonrpc: '2.0', id: 4, method: 'tools/call',
        params: { name: 'get_file_note', arguments: { file_path: 'src/nonexistent.ts' } },
      }),
    )
    const res = responses.find((r: any) => r.id === 4) as any
    expect(res.error).toBeDefined()
  })

  it('search_by_criticality returns filtered entries', async () => {
    const responses = await sendMcpRequest(
      JSON.stringify({
        jsonrpc: '2.0', id: 5, method: 'tools/call',
        params: { name: 'search_by_criticality', arguments: { threshold: 0.5 } },
      }),
    )
    const res = responses.find((r: any) => r.id === 5) as any
    const entries = JSON.parse(res.result.content[0].text)
    expect(entries.length).toBe(1)
    expect(entries[0].criticalityScore).toBe(0.7)
  })

  it('get_index returns full index', async () => {
    const responses = await sendMcpRequest(
      JSON.stringify({
        jsonrpc: '2.0', id: 6, method: 'tools/call',
        params: { name: 'get_index', arguments: {} },
      }),
    )
    const res = responses.find((r: any) => r.id === 6) as any
    const index = JSON.parse(res.result.content[0].text)
    expect(index.totalFiles).toBe(1)
    expect(index.entries[0].relativePath).toBe('src/a.ts')
  })
})
