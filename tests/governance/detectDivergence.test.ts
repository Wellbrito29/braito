import { describe, it, expect } from 'bun:test'
import path from 'node:path'
import { detectDivergences, divergencesByFile } from '../../src/core/governance/detectDivergence.ts'
import type { GovernanceContext, GovernanceModel, GovernanceDoc } from '../../src/core/governance/types.ts'

const ROOT = '/proj'

function doc(pathStr: string, category: GovernanceDoc['category'], rawContent: string): GovernanceDoc {
  return { path: pathStr, category, title: pathStr, sections: new Map(), rawContent }
}

function ctx(opts: {
  docs?: GovernanceDoc[]
  domainMappings?: Array<{ pattern: string; docPath: string }>
  fileGovernance?: Map<string, { governingDocs: string[]; constraints: string[]; decisions: string[] }>
}): GovernanceContext {
  const model: GovernanceModel = {
    detected: true,
    style: 'custom',
    docs: opts.docs ?? [],
    domainMappings: opts.domainMappings ?? [],
  }
  return {
    model,
    promptSummary: '',
    fileGovernance: opts.fileGovernance ?? new Map(),
  }
}

function abs(p: string) {
  return path.join(ROOT, p)
}

describe('detectDivergences', () => {
  it('returns empty list when governance is empty', () => {
    const result = detectDivergences({
      governance: ctx({}),
      files: ['src/foo.ts'],
      depGraph: new Map(),
      revGraph: new Map(),
      root: ROOT,
    })
    expect(result).toEqual([])
  })

  it('detects missing_file when docs reference a nonexistent file', () => {
    const fg = new Map([
      ['src/core/missing.ts', { governingDocs: ['Docs/architecture.md'], constraints: [], decisions: [] }],
      ['src/core/existing.ts', { governingDocs: ['Docs/architecture.md'], constraints: [], decisions: [] }],
    ])
    const result = detectDivergences({
      governance: ctx({ fileGovernance: fg, docs: [doc('Docs/architecture.md', 'architecture', '')] }),
      files: ['src/core/existing.ts'],
      depGraph: new Map(),
      revGraph: new Map(),
      root: ROOT,
    })
    const missing = result.filter((d) => d.type === 'missing_file')
    expect(missing).toHaveLength(1)
    expect(missing[0].evidence).toBe('src/core/missing.ts')
    expect(missing[0].docPath).toBe('Docs/architecture.md')
    expect(missing[0].severity).toBe('warn')
  })

  it('skips missing_file entries that look like directories or no extension', () => {
    const fg = new Map([
      ['src/core', { governingDocs: ['Docs/architecture.md'], constraints: [], decisions: [] }],
      ['src/core/some-feature', { governingDocs: ['Docs/architecture.md'], constraints: [], decisions: [] }],
    ])
    const result = detectDivergences({
      governance: ctx({ fileGovernance: fg, docs: [doc('Docs/architecture.md', 'architecture', '')] }),
      files: [],
      depGraph: new Map(),
      revGraph: new Map(),
      root: ROOT,
    })
    expect(result.filter((d) => d.type === 'missing_file')).toHaveLength(0)
  })

  it('detects undeclared_domain for files outside declared domain mappings', () => {
    const result = detectDivergences({
      governance: ctx({
        docs: [doc('Docs/architecture.md', 'architecture', '')],
        domainMappings: [{ pattern: 'src/core', docPath: 'Docs/architecture.md' }],
      }),
      files: ['src/core/a.ts', 'src/legacy/b.ts', 'src/cli/c.ts'],
      depGraph: new Map(),
      revGraph: new Map(),
      root: ROOT,
    })
    const undeclared = result.filter((d) => d.type === 'undeclared_domain')
    const paths = undeclared.map((d) => d.filePath).sort()
    expect(paths).toEqual(['src/cli/c.ts', 'src/legacy/b.ts'])
    expect(undeclared[0].severity).toBe('info')
  })

  it('does not detect undeclared_domain when no domain mappings are declared', () => {
    const result = detectDivergences({
      governance: ctx({ docs: [doc('Docs/architecture.md', 'architecture', '')] }),
      files: ['src/anywhere/a.ts'],
      depGraph: new Map(),
      revGraph: new Map(),
      root: ROOT,
    })
    expect(result.filter((d) => d.type === 'undeclared_domain')).toHaveLength(0)
  })

  it('detects forbidden_dependency from a "must not depend on" doc rule', () => {
    const rawDoc = '`src/domain` must not depend on `src/infra`'
    const depGraph = new Map([
      [abs('src/domain/a.ts'), [abs('src/infra/db.ts')]],
      [abs('src/cli/c.ts'), [abs('src/infra/db.ts')]],
    ])
    const result = detectDivergences({
      governance: ctx({ docs: [doc('Docs/architecture.md', 'architecture', rawDoc)] }),
      files: ['src/domain/a.ts', 'src/infra/db.ts', 'src/cli/c.ts'],
      depGraph,
      revGraph: new Map(),
      root: ROOT,
    })
    const forbidden = result.filter((d) => d.type === 'forbidden_dependency')
    expect(forbidden).toHaveLength(1)
    expect(forbidden[0].filePath).toBe('src/domain/a.ts')
    expect(forbidden[0].severity).toBe('error')
    expect(forbidden[0].message).toContain('src/domain')
    expect(forbidden[0].message).toContain('src/infra')
  })

  it('detects forbidden_dependency with "cannot import from" phrasing', () => {
    const rawDoc = '`src/controllers` cannot import from `src/db`.'
    const depGraph = new Map([[abs('src/controllers/x.ts'), [abs('src/db/conn.ts')]]])
    const result = detectDivergences({
      governance: ctx({ docs: [doc('Docs/architecture.md', 'architecture', rawDoc)] }),
      files: ['src/controllers/x.ts', 'src/db/conn.ts'],
      depGraph,
      revGraph: new Map(),
      root: ROOT,
    })
    expect(result.filter((d) => d.type === 'forbidden_dependency')).toHaveLength(1)
  })

  it('detects undocumented_hotspot for a widely-consumed file missing from docs', () => {
    const target = abs('src/core/widely-used.ts')
    const consumers = Array.from({ length: 6 }, (_, i) => abs(`src/cli/consumer-${i}.ts`))
    const revGraph = new Map([[target, consumers]])
    const result = detectDivergences({
      governance: ctx({
        docs: [doc('Docs/architecture.md', 'architecture', '')],
        domainMappings: [{ pattern: 'src/cli', docPath: 'Docs/architecture.md' }],
      }),
      files: ['src/core/widely-used.ts', ...consumers.map((c) => path.relative(ROOT, c))],
      depGraph: new Map(),
      revGraph,
      root: ROOT,
    })
    const hotspots = result.filter((d) => d.type === 'undocumented_hotspot')
    expect(hotspots).toHaveLength(1)
    expect(hotspots[0].filePath).toBe('src/core/widely-used.ts')
    expect(hotspots[0].severity).toBe('warn')
  })

  it('does not flag documented hotspots', () => {
    const target = abs('src/core/known.ts')
    const consumers = Array.from({ length: 6 }, (_, i) => abs(`src/cli/c-${i}.ts`))
    const revGraph = new Map([[target, consumers]])
    const fg = new Map([
      ['src/core/known.ts', { governingDocs: ['Docs/architecture.md'], constraints: [], decisions: [] }],
    ])
    const result = detectDivergences({
      governance: ctx({
        docs: [doc('Docs/architecture.md', 'architecture', '`src/core/known.ts`')],
        fileGovernance: fg,
      }),
      files: ['src/core/known.ts', ...consumers.map((c) => path.relative(ROOT, c))],
      depGraph: new Map(),
      revGraph,
      root: ROOT,
    })
    expect(result.filter((d) => d.type === 'undocumented_hotspot')).toHaveLength(0)
  })

  it('does not flag hotspots below the consumer threshold', () => {
    const target = abs('src/core/small.ts')
    const revGraph = new Map([[target, [abs('src/cli/a.ts')]]])
    const result = detectDivergences({
      governance: ctx({ docs: [doc('Docs/architecture.md', 'architecture', '')] }),
      files: ['src/core/small.ts', 'src/cli/a.ts'],
      depGraph: new Map(),
      revGraph,
      root: ROOT,
    })
    expect(result.filter((d) => d.type === 'undocumented_hotspot')).toHaveLength(0)
  })
})

describe('divergencesByFile', () => {
  it('groups divergences by filePath and drops entries with no file', () => {
    const divs = [
      { type: 'undeclared_domain' as const, severity: 'info' as const, message: 'x', filePath: 'src/a.ts' },
      { type: 'forbidden_dependency' as const, severity: 'error' as const, message: 'y', filePath: 'src/a.ts' },
      { type: 'missing_file' as const, severity: 'warn' as const, message: 'z' }, // no filePath
    ]
    const map = divergencesByFile(divs)
    expect(map.size).toBe(1)
    expect(map.get('src/a.ts')).toHaveLength(2)
  })
})
