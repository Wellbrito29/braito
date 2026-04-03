import { describe, it, expect } from 'bun:test'
import { buildBasicNote } from '../../src/core/output/buildBasicNote.ts'
import { buildIndex } from '../../src/core/output/buildIndex.ts'
import { SCHEMA_VERSION } from '../../src/core/types/schema-version.ts'
import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../../src/core/types/file-analysis.ts'

const analysis: StaticFileAnalysis = {
  filePath: '/project/src/example.ts',
  imports: [],
  localImports: [],
  externalImports: [],
  exports: ['example'],
  symbols: ['example'],
  hooks: [],
  envVars: [],
  apiCalls: [],
  comments: { todo: [], fixme: [], hack: [], invariant: [], decision: [] },
  hasSideEffects: false,
}

const graph: GraphSignals = {
  filePath: '/project/src/example.ts',
  directDependencies: [],
  reverseDependencies: [],
}

const tests: TestSignals = {
  filePath: '/project/src/example.ts',
  relatedTests: [],
}

const git: GitSignals = {
  filePath: '/project/src/example.ts',
  churnScore: 0,
  recentCommitMessages: [],
  recentCommits: [],
  coChangedFiles: [],
  authorCount: 1,
}

describe('schema versioning', () => {
  it('buildBasicNote includes schemaVersion matching SCHEMA_VERSION', () => {
    const note = buildBasicNote(analysis, graph, tests, git)
    expect(note.schemaVersion).toBe(SCHEMA_VERSION)
    expect(note.schemaVersion).toBe('1.0.0')
  })

  it('buildIndex includes schemaVersion matching SCHEMA_VERSION', () => {
    const note = buildBasicNote(analysis, graph, tests, git)
    const index = buildIndex([note], '/project')
    expect(index.schemaVersion).toBe(SCHEMA_VERSION)
    expect(index.schemaVersion).toBe('1.0.0')
  })
})
