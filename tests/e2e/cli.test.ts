import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { runScan } from '../../src/cli/commands/scan.ts'
import { runGenerate } from '../../src/cli/commands/generate.ts'
import { handleRequest } from '../../src/cli/commands/mcp.ts'

// ---------------------------------------------------------------------------
// Shared temp fixture
// ---------------------------------------------------------------------------

let tmpDir: string

function createFixture(): void {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-e2e-'))
  fs.mkdirSync(path.join(tmpDir, 'src'))
  fs.writeFileSync(
    path.join(tmpDir, 'src', 'index.ts'),
    `
export function hello(name: string): string {
  return \`Hello, \${name}!\`
}
`,
  )
  fs.writeFileSync(
    path.join(tmpDir, 'src', 'utils.ts'),
    `
import { hello } from './index'
export const greet = (n: string) => hello(n)
`,
  )
}

beforeAll(() => {
  createFixture()
})

afterAll(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// scan command
// ---------------------------------------------------------------------------

describe('scan command', () => {
  it('finds .ts files in a temp directory (default table format)', async () => {
    const output: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => output.push(args.join(' '))
    try {
      await runScan({ root: tmpDir })
    } finally {
      console.log = originalLog
    }
    // Should have found src/index.ts and src/utils.ts
    const combined = output.join('\n')
    expect(combined).toContain('index.ts')
    expect(combined).toContain('utils.ts')
  })

  it('outputs JSON with path, extension, size fields when format=json', async () => {
    const output: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => output.push(args.join(' '))
    try {
      await runScan({ root: tmpDir, format: 'json' })
    } finally {
      console.log = originalLog
    }
    const raw = output.join('')
    const parsed = JSON.parse(raw)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBeGreaterThanOrEqual(2)
    for (const entry of parsed) {
      expect(entry).toHaveProperty('path')
      expect(entry).toHaveProperty('extension')
      expect(entry).toHaveProperty('size')
      expect(entry.extension).toBe('.ts')
    }
  })

  it('returns both src/index.ts and src/utils.ts in json output', async () => {
    const output: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => output.push(args.join(' '))
    try {
      await runScan({ root: tmpDir, format: 'json' })
    } finally {
      console.log = originalLog
    }
    const parsed = JSON.parse(output.join(''))
    const paths = parsed.map((e: { path: string }) => e.path)
    expect(paths.some((p: string) => p.includes('index.ts'))).toBe(true)
    expect(paths.some((p: string) => p.includes('utils.ts'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// generate command
// ---------------------------------------------------------------------------

describe('generate command', () => {
  it('creates .ai-notes/ directory and sidecar files', async () => {
    await runGenerate({ root: tmpDir })

    const notesDir = path.join(tmpDir, '.ai-notes')
    expect(fs.existsSync(notesDir)).toBe(true)
    expect(fs.existsSync(path.join(notesDir, 'index.json'))).toBe(true)
    expect(fs.existsSync(path.join(notesDir, 'index.md'))).toBe(true)
  })

  it('writes JSON sidecar for each source file', async () => {
    const notesDir = path.join(tmpDir, '.ai-notes')
    expect(fs.existsSync(path.join(notesDir, 'src', 'index.ts.json'))).toBe(true)
    expect(fs.existsSync(path.join(notesDir, 'src', 'utils.ts.json'))).toBe(true)
  })

  it('writes Markdown sidecar for each source file', async () => {
    const notesDir = path.join(tmpDir, '.ai-notes')
    expect(fs.existsSync(path.join(notesDir, 'src', 'index.ts.md'))).toBe(true)
    expect(fs.existsSync(path.join(notesDir, 'src', 'utils.ts.md'))).toBe(true)
  })

  it('creates cache/hashes.json', async () => {
    expect(fs.existsSync(path.join(tmpDir, 'cache', 'hashes.json'))).toBe(true)
  })

  it('skips unchanged files on re-run (skipped > 0)', async () => {
    // logger uses console.log for info/success output
    const captured: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => { captured.push(args.join(' ')); originalLog(...args) }
    try {
      await runGenerate({ root: tmpDir })
    } finally {
      console.log = originalLog
    }
    const combined = captured.join('\n')
    // Should mention skipped files since nothing changed
    expect(combined).toMatch(/[Ss]kipped \d+ unchanged/)
  })

  it('reprocesses all files with --force', async () => {
    const captured: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => { captured.push(args.join(' ')); originalLog(...args) }
    try {
      await runGenerate({ root: tmpDir, force: true })
    } finally {
      console.log = originalLog
    }
    const combined = captured.join('\n')
    // Should say "Generated N notes" and not mention skipped
    expect(combined).toMatch(/Generated \d+ notes/)
    expect(combined).not.toMatch(/[Ss]kipped \d+ unchanged/)
  })

  it('JSON sidecars have required AiFileNote fields', async () => {
    const noteFile = path.join(tmpDir, '.ai-notes', 'src', 'index.ts.json')
    const note = JSON.parse(fs.readFileSync(noteFile, 'utf-8'))
    expect(note).toHaveProperty('filePath')
    expect(note).toHaveProperty('criticalityScore')
    expect(note).toHaveProperty('purpose')
    expect(note).toHaveProperty('invariants')
    expect(note).toHaveProperty('generatedAt')
    expect(note).toHaveProperty('model')
    expect(note.purpose).toHaveProperty('observed')
    expect(note.purpose).toHaveProperty('inferred')
    expect(note.purpose).toHaveProperty('confidence')
  })

  it('index.json contains entries for all generated files', async () => {
    const indexFile = path.join(tmpDir, '.ai-notes', 'index.json')
    const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'))
    expect(index).toHaveProperty('entries')
    expect(Array.isArray(index.entries)).toBe(true)
    expect(index.totalFiles).toBeGreaterThanOrEqual(2)
    const paths = index.entries.map((e: { relativePath: string }) => e.relativePath)
    expect(paths.some((p: string) => p.includes('index.ts'))).toBe(true)
    expect(paths.some((p: string) => p.includes('utils.ts'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// generate --filter
// ---------------------------------------------------------------------------

describe('generate --filter', () => {
  let filterTmpDir: string

  beforeAll(async () => {
    filterTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-filter-'))
    fs.mkdirSync(path.join(filterTmpDir, 'src'))
    fs.mkdirSync(path.join(filterTmpDir, 'lib'))
    fs.writeFileSync(path.join(filterTmpDir, 'src', 'app.ts'), `export const app = 'app'`)
    fs.writeFileSync(path.join(filterTmpDir, 'lib', 'helper.ts'), `export const help = 'help'`)
    await runGenerate({ root: filterTmpDir, filter: 'src/**' })
  })

  afterAll(() => {
    if (filterTmpDir) fs.rmSync(filterTmpDir, { recursive: true, force: true })
  })

  it('only generates notes for files matching the filter', () => {
    const srcNote = path.join(filterTmpDir, '.ai-notes', 'src', 'app.ts.json')
    const libNote = path.join(filterTmpDir, '.ai-notes', 'lib', 'helper.ts.json')
    expect(fs.existsSync(srcNote)).toBe(true)
    expect(fs.existsSync(libNote)).toBe(false)
  })

  it('still writes index.json with filtered entries', () => {
    const indexFile = path.join(filterTmpDir, '.ai-notes', 'index.json')
    expect(fs.existsSync(indexFile)).toBe(true)
    const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'))
    const paths = index.entries.map((e: { relativePath: string }) => e.relativePath)
    expect(paths.some((p: string) => p.includes('app.ts'))).toBe(true)
    expect(paths.some((p: string) => p.includes('helper.ts'))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// generate --diff
// ---------------------------------------------------------------------------

describe('generate --diff', () => {
  let diffTmpDir: string

  beforeAll(async () => {
    diffTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-diff-'))
    fs.mkdirSync(path.join(diffTmpDir, 'src'))
    fs.writeFileSync(
      path.join(diffTmpDir, 'src', 'widget.ts'),
      `export function widget() { return 'v1' }`,
    )
    // First generation — no diff yet
    await runGenerate({ root: diffTmpDir })
    // Modify the source file so re-generation detects a change
    fs.writeFileSync(
      path.join(diffTmpDir, 'src', 'widget.ts'),
      `export function widget() { return 'v2' }\nexport function extra() { return true }`,
    )
  })

  afterAll(() => {
    if (diffTmpDir) fs.rmSync(diffTmpDir, { recursive: true, force: true })
  })

  it('produces diff output when --diff is set and file changed', async () => {
    const stdoutLines: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => stdoutLines.push(args.join(' '))
    try {
      await runGenerate({ root: diffTmpDir, diff: true })
    } finally {
      console.log = originalLog
    }
    // renderDiff writes to console.log
    // Even if no fields changed (static note is same structure), the command should complete
    // The diff report header or empty diff block should be present
    const combined = stdoutLines.join('\n')
    expect(combined).toContain('Diff Report')
  })
})

// ---------------------------------------------------------------------------
// MCP server — direct handleRequest tests
// ---------------------------------------------------------------------------

describe('mcp server (handleRequest)', () => {
  let mcpTmpDir: string
  let notesDir: string

  const MOCK_NOTE = {
    schemaVersion: '1.0.0',
    filePath: '/tmp/project/src/a.ts',
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
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalFiles: 1,
    synthesizedFiles: 0,
    staleFiles: 0,
    entries: [
      {
        filePath: '/tmp/project/src/a.ts',
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
    mcpTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-mcp-e2e-'))
    notesDir = path.join(mcpTmpDir, '.ai-notes', 'src')
    fs.mkdirSync(notesDir, { recursive: true })
    fs.writeFileSync(path.join(notesDir, 'a.ts.json'), JSON.stringify(MOCK_NOTE))
    fs.writeFileSync(path.join(mcpTmpDir, '.ai-notes', 'index.json'), JSON.stringify(MOCK_INDEX))
  })

  afterAll(() => {
    if (mcpTmpDir) fs.rmSync(mcpTmpDir, { recursive: true, force: true })
  })

  it('initialize method returns server info', async () => {
    const req = { jsonrpc: '2.0' as const, id: 1, method: 'initialize', params: {} }
    const res = await handleRequest(req, mcpTmpDir, '.ai-notes')
    expect(res).not.toBeNull()
    expect(res!.id).toBe(1)
    expect((res!.result as any).serverInfo.name).toBe('braito')
    expect((res!.result as any).protocolVersion).toBe('2024-11-05')
    expect((res!.result as any).capabilities.tools).toBeDefined()
  })

  it('tools/list returns 3 tools', async () => {
    const req = { jsonrpc: '2.0' as const, id: 2, method: 'tools/list', params: {} }
    const res = await handleRequest(req, mcpTmpDir, '.ai-notes')
    expect(res).not.toBeNull()
    const tools = (res!.result as any).tools
    expect(Array.isArray(tools)).toBe(true)
    expect(tools).toHaveLength(3)
    const names = tools.map((t: { name: string }) => t.name)
    expect(names).toContain('get_file_note')
    expect(names).toContain('search_by_criticality')
    expect(names).toContain('get_index')
  })

  it('notifications/initialized returns null (no response)', async () => {
    const req = { jsonrpc: '2.0' as const, id: null, method: 'notifications/initialized' }
    const res = await handleRequest(req, mcpTmpDir, '.ai-notes')
    expect(res).toBeNull()
  })

  it('get_file_note returns error when note does not exist', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 3,
      method: 'tools/call',
      params: { name: 'get_file_note', arguments: { file_path: 'src/nonexistent.ts' } },
    }
    const res = await handleRequest(req, mcpTmpDir, '.ai-notes')
    expect(res).not.toBeNull()
    expect(res!.error).toBeDefined()
    expect(res!.error!.code).toBe(-32602)
  })

  it('get_file_note returns note content when file exists', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 4,
      method: 'tools/call',
      params: { name: 'get_file_note', arguments: { file_path: 'src/a.ts' } },
    }
    const res = await handleRequest(req, mcpTmpDir, '.ai-notes')
    expect(res).not.toBeNull()
    expect(res!.result).toBeDefined()
    const content = (res!.result as any).content[0].text
    const note = JSON.parse(content)
    expect(note.criticalityScore).toBe(0.7)
  })

  it('get_index returns error when no index exists', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-mcp-empty-'))
    try {
      const req = {
        jsonrpc: '2.0' as const,
        id: 5,
        method: 'tools/call',
        params: { name: 'get_index', arguments: {} },
      }
      const res = await handleRequest(req, emptyDir, '.ai-notes')
      expect(res).not.toBeNull()
      expect(res!.error).toBeDefined()
      expect(res!.error!.code).toBe(-32602)
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true })
    }
  })

  it('get_index returns the full index when it exists', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 6,
      method: 'tools/call',
      params: { name: 'get_index', arguments: {} },
    }
    const res = await handleRequest(req, mcpTmpDir, '.ai-notes')
    expect(res).not.toBeNull()
    expect(res!.result).toBeDefined()
    const index = JSON.parse((res!.result as any).content[0].text)
    expect(index.totalFiles).toBe(1)
    expect(index.entries[0].relativePath).toBe('src/a.ts')
  })

  it('unknown method returns error -32601', async () => {
    const req = { jsonrpc: '2.0' as const, id: 7, method: 'unknown/method' }
    const res = await handleRequest(req, mcpTmpDir, '.ai-notes')
    expect(res).not.toBeNull()
    expect(res!.error).toBeDefined()
    expect(res!.error!.code).toBe(-32601)
  })
})
