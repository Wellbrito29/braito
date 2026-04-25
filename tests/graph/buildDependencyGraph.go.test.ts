import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { buildDependencyGraph } from '../../src/core/graph/buildDependencyGraph.ts'
import { resolveImportPath } from '../../src/core/graph/resolveImportPath.ts'
import type { StaticFileAnalysis } from '../../src/core/types/file-analysis.ts'

let tmpDir: string

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-go-graph-test-'))
  // Mimic a Go monorepo:
  //   /go.mod  →  module rd-autonomous-team
  //   /internal/agents/ralph_engine.go
  //   /internal/contracts/types.go
  //   /internal/llm/provider.go
  fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module rd-autonomous-team\n\ngo 1.24\n')
  fs.mkdirSync(path.join(tmpDir, 'internal', 'agents'), { recursive: true })
  fs.mkdirSync(path.join(tmpDir, 'internal', 'contracts'), { recursive: true })
  fs.mkdirSync(path.join(tmpDir, 'internal', 'llm'), { recursive: true })
  fs.writeFileSync(path.join(tmpDir, 'internal', 'agents', 'ralph_engine.go'), 'package agents\n')
  fs.writeFileSync(path.join(tmpDir, 'internal', 'contracts', 'types.go'), 'package contracts\n')
  fs.writeFileSync(path.join(tmpDir, 'internal', 'llm', 'provider.go'), 'package llm\n')
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function makeAnalysis(filePath: string, localImports: string[]): StaticFileAnalysis {
  return {
    filePath,
    imports: localImports,
    localImports,
    externalImports: [],
    exports: [],
    exportDetails: [],
    symbols: [],
    hooks: [],
    envVars: [],
    apiCalls: [],
    comments: { todo: [], fixme: [], hack: [], invariant: [], decision: [] },
    hasSideEffects: false,
    signatures: [],
  }
}

describe('Go module-local imports', () => {
  it('resolves <module>/path/to/pkg to a representative .go file', () => {
    const ralphPath = path.join(tmpDir, 'internal', 'agents', 'ralph_engine.go')
    const contractsImport = 'rd-autonomous-team/internal/contracts'
    const llmImport = 'rd-autonomous-team/internal/llm'

    const analyses = [
      makeAnalysis(ralphPath, [contractsImport, llmImport]),
    ]

    const graph = buildDependencyGraph(analyses, tmpDir)
    const deps = graph.get(ralphPath) ?? []

    // Each module-local import should resolve to ONE .go file in the
    // referenced package directory (the first non-test file we find).
    expect(deps).toHaveLength(2)
    expect(deps).toContain(path.join(tmpDir, 'internal', 'contracts', 'types.go'))
    expect(deps).toContain(path.join(tmpDir, 'internal', 'llm', 'provider.go'))
  })

  it('falls back to null for imports outside the module path', () => {
    // Stdlib + third-party imports never resolve via the module path —
    // they remain external (no graph edge).
    const ralphPath = path.join(tmpDir, 'internal', 'agents', 'ralph_engine.go')
    const stdlibImport = 'context'

    // Note: `localImports` from the analyzer would not include stdlib in
    // the first place; we test resolveImportPath directly to assert the
    // contract.
    const resolved = resolveImportPath(stdlibImport, ralphPath, tmpDir, {
      goModulePath: 'rd-autonomous-team',
    })
    expect(resolved).toBeNull()
  })

  it('skips Go module resolution when no goModulePath is provided', () => {
    const ralphPath = path.join(tmpDir, 'internal', 'agents', 'ralph_engine.go')
    const resolved = resolveImportPath(
      'rd-autonomous-team/internal/contracts',
      ralphPath,
      tmpDir,
      {}, // no goModulePath
    )
    expect(resolved).toBeNull()
  })

  it('handles bare-module import (specifier === module path)', () => {
    const ralphPath = path.join(tmpDir, 'internal', 'agents', 'ralph_engine.go')
    // Some Go code imports the bare module path (e.g. for cmd entry points).
    // We resolve to root — there's typically no .go directly there in
    // monorepos, so this returns null in our fixture (root has only
    // go.mod). The important contract: it doesn't crash.
    const resolved = resolveImportPath('rd-autonomous-team', ralphPath, tmpDir, {
      goModulePath: 'rd-autonomous-team',
    })
    expect(resolved).toBeNull()
  })
})

describe('resolveImportPath backward compatibility', () => {
  it('still accepts a bare aliases object as the 4th param', () => {
    // Older callers in the codebase pass `aliases` directly. We must
    // not break that signature.
    const aPath = path.join(tmpDir, 'a.ts')
    fs.writeFileSync(aPath, '')
    const resolved = resolveImportPath('./a', aPath, tmpDir, {})
    // No aliases configured + no extension match because base is the
    // file itself; resolveWithExtensions handles that.
    expect(resolved).toBe(aPath)
  })
})
