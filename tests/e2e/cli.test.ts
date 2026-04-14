import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { runScan } from '../../src/cli/commands/scan.ts'
import { runGenerate } from '../../src/cli/commands/generate.ts'
import { handleRequest } from '../../src/cli/commands/mcp.ts'
import { runInit } from '../../src/cli/commands/init.ts'

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

  it('tools/list returns 11 tools', async () => {
    const req = { jsonrpc: '2.0' as const, id: 2, method: 'tools/list', params: {} }
    const res = await handleRequest(req, mcpTmpDir, '.ai-notes')
    expect(res).not.toBeNull()
    const tools = (res!.result as any).tools
    expect(Array.isArray(tools)).toBe(true)
    expect(tools).toHaveLength(11)
    const names = tools.map((t: { name: string }) => t.name)
    expect(names).toContain('get_file_note')
    expect(names).toContain('search_by_criticality')
    expect(names).toContain('get_index')
    expect(names).toContain('get_architecture_context')
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

// ---------------------------------------------------------------------------
// debugSignals — emitted in every generated note
// ---------------------------------------------------------------------------

describe('debugSignals in generated notes', () => {
  it('JSON sidecars contain a debugSignals object with all required fields', async () => {
    const noteFile = path.join(tmpDir, '.ai-notes', 'src', 'index.ts.json')
    const note = JSON.parse(fs.readFileSync(noteFile, 'utf-8'))
    expect(note).toHaveProperty('debugSignals')
    const s = note.debugSignals
    expect(typeof s.reverseDepCount).toBe('number')
    expect(typeof s.directDepCount).toBe('number')
    expect(typeof s.hasHooks).toBe('boolean')
    expect(typeof s.hasExternalImports).toBe('boolean')
    expect(typeof s.hasEnvVars).toBe('boolean')
    expect(typeof s.hasApiCalls).toBe('boolean')
    expect(typeof s.hasTodoComments).toBe('boolean')
    expect(typeof s.hasTests).toBe('boolean')
    expect(s.coveragePct === null || typeof s.coveragePct === 'number').toBe(true)
    expect(typeof s.churnScore).toBe('number')
    expect(typeof s.authorCount).toBe('number')
    expect(Array.isArray(s.coChangedFiles)).toBe(true)
  })

  it('index.ts is consumed by utils.ts so reverseDepCount >= 1', async () => {
    const noteFile = path.join(tmpDir, '.ai-notes', 'src', 'index.ts.json')
    const note = JSON.parse(fs.readFileSync(noteFile, 'utf-8'))
    // utils.ts imports from ./index, so index.ts has at least one reverse dep
    expect(note.debugSignals.reverseDepCount).toBeGreaterThanOrEqual(1)
  })

  it('utils.ts has no reverse dependents so reverseDepCount is 0', async () => {
    const noteFile = path.join(tmpDir, '.ai-notes', 'src', 'utils.ts.json')
    const note = JSON.parse(fs.readFileSync(noteFile, 'utf-8'))
    expect(note.debugSignals.reverseDepCount).toBe(0)
  })

  it('utils.ts has at least 1 direct dependency (imports index.ts)', async () => {
    const noteFile = path.join(tmpDir, '.ai-notes', 'src', 'utils.ts.json')
    const note = JSON.parse(fs.readFileSync(noteFile, 'utf-8'))
    expect(note.debugSignals.directDepCount).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// generate --dry-run
// ---------------------------------------------------------------------------

describe('generate --dry-run', () => {
  let dryTmpDir: string

  beforeAll(async () => {
    dryTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-dryrun-'))
    fs.mkdirSync(path.join(dryTmpDir, 'src'))
    fs.writeFileSync(
      path.join(dryTmpDir, 'src', 'main.ts'),
      `export function main() { return 42 }`,
    )
  })

  afterAll(() => {
    if (dryTmpDir) fs.rmSync(dryTmpDir, { recursive: true, force: true })
  })

  it('does not write .ai-notes/ directory when --dry-run is set', async () => {
    await runGenerate({ root: dryTmpDir, dryRun: true })
    expect(fs.existsSync(path.join(dryTmpDir, '.ai-notes'))).toBe(false)
  })

  it('does not write cache/hashes.json when --dry-run is set', async () => {
    expect(fs.existsSync(path.join(dryTmpDir, 'cache', 'hashes.json'))).toBe(false)
  })

  it('prints a dry-run preview table to stdout', async () => {
    const lines: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => lines.push(args.join(' '))
    try {
      await runGenerate({ root: dryTmpDir, dryRun: true })
    } finally {
      console.log = originalLog
    }
    const out = lines.join('\n')
    expect(out).toMatch(/dry.?run|DRY.?RUN|Dry.?Run|would write|Would write/i)
  })
})

// ---------------------------------------------------------------------------
// init --agent command
// ---------------------------------------------------------------------------

describe('init --agent command', () => {
  let initTmpDir: string

  beforeAll(async () => {
    initTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-init-'))
    await runInit({ root: initTmpDir, agent: true })
  })

  afterAll(() => {
    if (initTmpDir) fs.rmSync(initTmpDir, { recursive: true, force: true })
  })

  it('creates .claude/commands/ directory', () => {
    expect(fs.existsSync(path.join(initTmpDir, '.claude', 'commands'))).toBe(true)
  })

  it('generates braito-note.md', () => {
    const f = path.join(initTmpDir, '.claude', 'commands', 'braito-note.md')
    expect(fs.existsSync(f)).toBe(true)
    expect(fs.readFileSync(f, 'utf-8')).toContain('get_file_note')
  })

  it('generates braito-impact.md', () => {
    const f = path.join(initTmpDir, '.claude', 'commands', 'braito-impact.md')
    expect(fs.existsSync(f)).toBe(true)
    expect(fs.readFileSync(f, 'utf-8')).toContain('get_impact')
  })

  it('generates braito-search.md', () => {
    const f = path.join(initTmpDir, '.claude', 'commands', 'braito-search.md')
    expect(fs.existsSync(f)).toBe(true)
    expect(fs.readFileSync(f, 'utf-8')).toContain('search')
  })

  it('is idempotent — running twice does not throw and produces same files', async () => {
    await runInit({ root: initTmpDir, agent: true })
    const files = fs.readdirSync(path.join(initTmpDir, '.claude', 'commands'))
    expect(files).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// MCP server — additional tool coverage
// ---------------------------------------------------------------------------

describe('mcp server — extended tool tests', () => {
  let extMcpDir: string

  const MOCK_NOTE_A = {
    schemaVersion: '1.0.0',
    filePath: 'src/core/a.ts',
    purpose: { observed: ['Handles authentication tokens'], inferred: [], confidence: 0.8, evidence: [] },
    invariants: { observed: ['Token must not be null'], inferred: [], confidence: 0.7, evidence: [] },
    sensitiveDependencies: { observed: [], inferred: [], confidence: 0, evidence: [] },
    importantDecisions: { observed: [], inferred: [], confidence: 0, evidence: [] },
    knownPitfalls: { observed: ['Token can expire unexpectedly'], inferred: [], confidence: 0.5, evidence: [] },
    impactValidation: { observed: [], inferred: [], confidence: 0, evidence: [] },
    recentChanges: [],
    criticalityScore: 0.8,
    debugSignals: { reverseDepCount: 3, directDepCount: 1, hasHooks: false, hasExternalImports: false,
      hasEnvVars: false, hasApiCalls: false, hasTodoComments: false, hasTests: false,
      coveragePct: null, churnScore: 5, authorCount: 1, coChangedFiles: [] },
    generatedAt: new Date().toISOString(),
    model: 'static',
  }

  const MOCK_NOTE_B = {
    schemaVersion: '1.0.0',
    filePath: 'src/utils/b.ts',
    purpose: { observed: ['Utility helpers for string formatting'], inferred: [], confidence: 0.5, evidence: [] },
    invariants: { observed: [], inferred: [], confidence: 0, evidence: [] },
    sensitiveDependencies: { observed: [], inferred: [], confidence: 0, evidence: [] },
    importantDecisions: { observed: [], inferred: [], confidence: 0, evidence: [] },
    knownPitfalls: { observed: [], inferred: [], confidence: 0, evidence: [] },
    impactValidation: { observed: [], inferred: [], confidence: 0, evidence: [] },
    recentChanges: [],
    criticalityScore: 0.2,
    debugSignals: { reverseDepCount: 0, directDepCount: 0, hasHooks: false, hasExternalImports: false,
      hasEnvVars: false, hasApiCalls: false, hasTodoComments: false, hasTests: false,
      coveragePct: null, churnScore: 1, authorCount: 1, coChangedFiles: [] },
    generatedAt: new Date().toISOString(),
    model: 'static',
  }

  const MOCK_INDEX = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalFiles: 2,
    synthesizedFiles: 0,
    staleFiles: 0,
    entries: [
      {
        filePath: 'src/core/a.ts',
        relativePath: 'src/core/a.ts',
        domain: 'src/core',
        criticalityScore: 0.8,
        model: 'static',
        purpose: 'Handles authentication tokens',
        generatedAt: MOCK_NOTE_A.generatedAt,
        stale: false,
        dependents: ['src/utils/b.ts'],
      },
      {
        filePath: 'src/utils/b.ts',
        relativePath: 'src/utils/b.ts',
        domain: 'src/utils',
        criticalityScore: 0.2,
        model: 'static',
        purpose: 'Utility helpers for string formatting',
        generatedAt: MOCK_NOTE_B.generatedAt,
        stale: false,
        dependents: [],
      },
    ],
  }

  beforeAll(() => {
    extMcpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-mcp-ext-'))
    fs.mkdirSync(path.join(extMcpDir, '.ai-notes', 'src', 'core'), { recursive: true })
    fs.mkdirSync(path.join(extMcpDir, '.ai-notes', 'src', 'utils'), { recursive: true })
    fs.writeFileSync(path.join(extMcpDir, '.ai-notes', 'src', 'core', 'a.ts.json'), JSON.stringify(MOCK_NOTE_A))
    fs.writeFileSync(path.join(extMcpDir, '.ai-notes', 'src', 'utils', 'b.ts.json'), JSON.stringify(MOCK_NOTE_B))
    fs.writeFileSync(path.join(extMcpDir, '.ai-notes', 'index.json'), JSON.stringify(MOCK_INDEX))
  })

  afterAll(() => {
    if (extMcpDir) fs.rmSync(extMcpDir, { recursive: true, force: true })
  })

  it('search_by_criticality returns only files above threshold', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 10,
      method: 'tools/call',
      params: { name: 'search_by_criticality', arguments: { threshold: 0.5, limit: 10 } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    expect(res!.result).toBeDefined()
    const results = JSON.parse((res!.result as any).content[0].text)
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(1)
    expect(results[0].relativePath).toBe('src/core/a.ts')
    expect(results[0].criticalityScore).toBeGreaterThanOrEqual(0.5)
  })

  it('search_by_criticality with low threshold returns all files', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 11,
      method: 'tools/call',
      params: { name: 'search_by_criticality', arguments: { threshold: 0.1 } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    const results = JSON.parse((res!.result as any).content[0].text)
    expect(results.length).toBe(2)
  })

  it('get_architecture_context returns summary, domains, and topCriticalFiles', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 12,
      method: 'tools/call',
      params: { name: 'get_architecture_context', arguments: { top_n: 5 } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    expect(res!.result).toBeDefined()
    const ctx = JSON.parse((res!.result as any).content[0].text)
    expect(ctx).toHaveProperty('summary')
    expect(ctx).toHaveProperty('domains')
    expect(ctx).toHaveProperty('topCriticalFiles')
    expect(ctx.summary.totalFiles).toBe(2)
    expect(Array.isArray(ctx.domains)).toBe(true)
    expect(ctx.domains.some((d: { name: string }) => d.name === 'src/core')).toBe(true)
  })

  it('get_impact returns BFS dependents for a file', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 13,
      method: 'tools/call',
      params: { name: 'get_impact', arguments: { file_path: 'src/core/a.ts', depth: 2 } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    expect(res!.result).toBeDefined()
    const impact = JSON.parse((res!.result as any).content[0].text)
    expect(impact.file).toBe('src/core/a.ts')
    expect(typeof impact.totalAffected).toBe('number')
    expect(Array.isArray(impact.dependents)).toBe(true)
    // src/utils/b.ts is a dependent of src/core/a.ts
    expect(impact.dependents.some((d: { relativePath: string }) => d.relativePath === 'src/utils/b.ts')).toBe(true)
  })

  it('get_impact returns zero dependents for a leaf file', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 14,
      method: 'tools/call',
      params: { name: 'get_impact', arguments: { file_path: 'src/utils/b.ts' } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    const impact = JSON.parse((res!.result as any).content[0].text)
    expect(impact.totalAffected).toBe(0)
    expect(impact.dependents).toHaveLength(0)
  })

  it('search returns files matching query in purpose/pitfalls', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 15,
      method: 'tools/call',
      params: { name: 'search', arguments: { query: 'authentication' } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    expect(res!.result).toBeDefined()
    const result = JSON.parse((res!.result as any).content[0].text)
    expect(result.totalResults).toBeGreaterThanOrEqual(1)
    expect(result.results[0].relativePath).toBe('src/core/a.ts')
    expect(result.results[0].matches.length).toBeGreaterThanOrEqual(1)
  })

  it('search returns empty results for a query that matches nothing', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 16,
      method: 'tools/call',
      params: { name: 'search', arguments: { query: 'xyzzy_no_match_expected' } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    const result = JSON.parse((res!.result as any).content[0].text)
    expect(result.totalResults).toBe(0)
    expect(result.results).toHaveLength(0)
  })

  it('search returns error for empty query', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 17,
      method: 'tools/call',
      params: { name: 'search', arguments: { query: '' } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    expect(res!.error).toBeDefined()
    expect(res!.error!.code).toBe(-32602)
  })

  it('get_domain returns files for a known domain sorted by criticality', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 18,
      method: 'tools/call',
      params: { name: 'get_domain', arguments: { domain: 'src/core' } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    expect(res!.result).toBeDefined()
    const result = JSON.parse((res!.result as any).content[0].text)
    expect(result.domain).toBe('src/core')
    expect(result.fileCount).toBe(1)
    expect(result.files[0].relativePath).toBe('src/core/a.ts')
  })

  it('get_domain returns error for unknown domain', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 19,
      method: 'tools/call',
      params: { name: 'get_domain', arguments: { domain: 'nonexistent/domain' } },
    }
    const res = await handleRequest(req, extMcpDir, '.ai-notes')
    expect(res!.error).toBeDefined()
    expect(res!.error!.code).toBe(-32602)
    expect(res!.error!.message).toContain('not found')
  })
})

// ---------------------------------------------------------------------------
// loadProjectContext integration
// ---------------------------------------------------------------------------

describe('loadProjectContext integration', () => {
  let ctxTmpDir: string

  beforeAll(async () => {
    ctxTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-ctx-'))
    fs.mkdirSync(path.join(ctxTmpDir, 'src'))
    fs.writeFileSync(
      path.join(ctxTmpDir, 'src', 'service.ts'),
      `export function fetchData(url: string) { return fetch(url) }`,
    )
  })

  afterAll(() => {
    if (ctxTmpDir) fs.rmSync(ctxTmpDir, { recursive: true, force: true })
  })

  it('runs generate successfully without braito.context.md', async () => {
    await runGenerate({ root: ctxTmpDir })
    const notesDir = path.join(ctxTmpDir, '.ai-notes')
    expect(fs.existsSync(notesDir)).toBe(true)
    expect(fs.existsSync(path.join(notesDir, 'index.json'))).toBe(true)
  })

  it('logs context loaded message when braito.context.md is present', async () => {
    fs.writeFileSync(
      path.join(ctxTmpDir, 'braito.context.md'),
      `# Project Context\nThis is an e2e test project.`,
    )
    const lines: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => lines.push(args.join(' '))
    try {
      await runGenerate({ root: ctxTmpDir, force: true })
    } finally {
      console.log = originalLog
    }
    const out = lines.join('\n')
    expect(out).toContain('braito.context.md')
  })

  it('braito.context.md content does not break the pipeline — notes are still generated', async () => {
    const noteFile = path.join(ctxTmpDir, '.ai-notes', 'src', 'service.ts.json')
    expect(fs.existsSync(noteFile)).toBe(true)
    const note = JSON.parse(fs.readFileSync(noteFile, 'utf-8'))
    expect(note).toHaveProperty('filePath')
    expect(note).toHaveProperty('criticalityScore')
  })
})
