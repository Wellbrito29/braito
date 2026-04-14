import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { handleRequest, parseRootsSpec, buildRegistry, type RepoEntry } from '../../src/cli/commands/mcp.ts'
import { runGenerate } from '../../src/cli/commands/generate.ts'

let repoA: string
let repoB: string
let registry: RepoEntry[]

function seed(dir: string, file: string, body: string) {
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'src', file), body)
}

beforeAll(async () => {
  repoA = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-multi-a-'))
  repoB = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-multi-b-'))
  seed(repoA, 'a.ts', 'export const a = 1\n')
  seed(repoB, 'b.ts', 'export const b = 2\n')
  await runGenerate({ root: repoA })
  await runGenerate({ root: repoB })
  registry = [
    { alias: 'api', root: repoA, outputDir: '.ai-notes' },
    { alias: 'web', root: repoB, outputDir: '.ai-notes' },
  ]
})

afterAll(() => {
  if (repoA) fs.rmSync(repoA, { recursive: true, force: true })
  if (repoB) fs.rmSync(repoB, { recursive: true, force: true })
})

describe('parseRootsSpec', () => {
  it('parses a single path (alias derived from basename)', () => {
    const out = parseRootsSpec('/tmp/my-repo')
    expect(out).toEqual([{ alias: 'my-repo', root: '/tmp/my-repo' }])
  })

  it('parses comma-separated paths', () => {
    const out = parseRootsSpec('/tmp/foo,/tmp/bar')
    expect(out.map((r) => r.alias)).toEqual(['foo', 'bar'])
  })

  it('parses alias=path form', () => {
    const out = parseRootsSpec('api=/tmp/x,web=/tmp/y')
    expect(out).toEqual([
      { alias: 'api', root: '/tmp/x' },
      { alias: 'web', root: '/tmp/y' },
    ])
  })

  it('ignores empty entries and trims whitespace', () => {
    const out = parseRootsSpec(' api=/tmp/x ,,  web=/tmp/y ')
    expect(out.map((r) => r.alias)).toEqual(['api', 'web'])
  })
})

describe('buildRegistry', () => {
  it('builds single-entry registry from root', async () => {
    const reg = await buildRegistry({ root: repoA })
    expect(reg).toHaveLength(1)
    expect(reg[0].root).toBe(path.resolve(repoA))
  })

  it('throws on duplicate aliases', async () => {
    await expect(buildRegistry({ roots: `same=${repoA},same=${repoB}` })).rejects.toThrow(/Duplicate repo alias/)
  })

  it('throws on malformed roots', async () => {
    await expect(buildRegistry({ roots: ',,,' })).rejects.toThrow(/empty or malformed/)
  })
})

describe('handleRequest with multi-repo registry', () => {
  it('list_repos returns all registered repos', async () => {
    const req = { jsonrpc: '2.0' as const, id: 1, method: 'tools/call', params: { name: 'list_repos', arguments: {} } }
    const res = await handleRequest(req, registry)
    const payload = JSON.parse((res!.result as any).content[0].text)
    expect(payload.count).toBe(2)
    expect(payload.repos.map((r: any) => r.alias).sort()).toEqual(['api', 'web'])
  })

  it('get_file_note routes to the correct repo via repo arg', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 2,
      method: 'tools/call',
      params: { name: 'get_file_note', arguments: { repo: 'api', file_path: 'src/a.ts' } },
    }
    const res = await handleRequest(req, registry)
    const note = JSON.parse((res!.result as any).content[0].text)
    expect(note.filePath.endsWith('src/a.ts')).toBe(true)
  })

  it('get_file_note for repo B returns B note, not A', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 3,
      method: 'tools/call',
      params: { name: 'get_file_note', arguments: { repo: 'web', file_path: 'src/b.ts' } },
    }
    const res = await handleRequest(req, registry)
    const note = JSON.parse((res!.result as any).content[0].text)
    expect(note.filePath.endsWith('src/b.ts')).toBe(true)
  })

  it('returns error when repo argument is missing and multiple repos are registered', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 4,
      method: 'tools/call',
      params: { name: 'get_index', arguments: {} },
    }
    const res = await handleRequest(req, registry)
    expect(res!.error).toBeDefined()
    expect(res!.error!.message).toMatch(/Specify "repo"/)
  })

  it('returns error when repo alias is unknown', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 5,
      method: 'tools/call',
      params: { name: 'get_index', arguments: { repo: 'nonexistent' } },
    }
    const res = await handleRequest(req, registry)
    expect(res!.error).toBeDefined()
    expect(res!.error!.message).toMatch(/not found/)
  })

  it('backward compat: two-arg signature (root, outputDir) still works for single repo', async () => {
    const req = {
      jsonrpc: '2.0' as const,
      id: 6,
      method: 'tools/call',
      params: { name: 'get_index', arguments: {} },
    }
    const res = await handleRequest(req, repoA, '.ai-notes')
    expect(res!.error).toBeUndefined()
    const idx = JSON.parse((res!.result as any).content[0].text)
    expect(Array.isArray(idx.entries)).toBe(true)
  })

  it('single-repo registry does not require repo arg', async () => {
    const singleReg: RepoEntry[] = [{ alias: 'solo', root: repoA, outputDir: '.ai-notes' }]
    const req = {
      jsonrpc: '2.0' as const,
      id: 7,
      method: 'tools/call',
      params: { name: 'get_index', arguments: {} },
    }
    const res = await handleRequest(req, singleReg)
    expect(res!.error).toBeUndefined()
  })
})
