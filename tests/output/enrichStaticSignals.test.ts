import { describe, it, expect } from 'bun:test'
import {
  classifyByFilename,
  classifyImports,
  inferCrossSignals,
  enrichStaticSignals,
} from '../../src/core/output/enrichStaticSignals.ts'
import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../../src/core/types/file-analysis.ts'

function makeAnalysis(overrides: Partial<StaticFileAnalysis> = {}): StaticFileAnalysis {
  return {
    filePath: '/project/src/example.ts',
    imports: [],
    localImports: [],
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
    ...overrides,
  }
}

const emptyGraph: GraphSignals = { filePath: '', directDependencies: [], reverseDependencies: [] }
const emptyTests: TestSignals = { filePath: '', relatedTests: [] }
const emptyGit: GitSignals = { filePath: '', churnScore: 0, recentCommitMessages: [], recentCommits: [], coChangedFiles: [], authorCount: 0 }

describe('classifyByFilename', () => {
  it('labels NestJS controllers', () => {
    expect(classifyByFilename('src/api/products.controller.ts')).toContain('HTTP controller')
  })

  it('labels services', () => {
    expect(classifyByFilename('src/domains/products.service.ts')).toContain('Service')
  })

  it('labels modules', () => {
    expect(classifyByFilename('src/app.module.ts')).toContain('NestJS module')
  })

  it('labels use-cases by filename suffix', () => {
    expect(classifyByFilename('src/use-cases/list-products.use-case.ts')).toContain('Use case')
  })

  it('labels use-cases by directory membership', () => {
    expect(classifyByFilename('src/domains/products/use-cases/something-odd.ts')).toContain('Use case')
  })

  it('labels entities', () => {
    expect(classifyByFilename('src/models/product.entity.ts')).toContain('Domain entity')
  })

  it('labels DTOs', () => {
    expect(classifyByFilename('src/dtos/product.dto.ts')).toContain('Data transfer object')
  })

  it('labels enums', () => {
    expect(classifyByFilename('src/enums/status.enum.ts')).toContain('Enumeration')
  })

  it('labels guards', () => {
    expect(classifyByFilename('src/auth/jwt.guard.ts')).toContain('Route guard')
  })

  it('labels filters', () => {
    expect(classifyByFilename('src/infra/exception.filter.ts')).toContain('Exception filter')
  })

  it('labels middleware', () => {
    expect(classifyByFilename('src/infra/logger.middleware.ts')).toContain('HTTP middleware')
  })

  it('labels tests', () => {
    expect(classifyByFilename('src/foo.test.ts')).toContain('Test suite')
    expect(classifyByFilename('src/foo.spec.ts')).toContain('Test suite')
  })

  it('labels repositories', () => {
    expect(classifyByFilename('src/db/user.repository.ts')).toContain('Data access')
  })

  it('labels React hooks by filename prefix', () => {
    expect(classifyByFilename('src/hooks/useSearch.ts')).toContain('React hook')
  })

  it('labels index.ts as barrel export', () => {
    expect(classifyByFilename('src/domains/index.ts')).toContain('Barrel export')
  })

  it('returns null for unknown patterns', () => {
    expect(classifyByFilename('src/arbitrary.ts')).toBeNull()
  })
})

describe('classifyImports', () => {
  it('tags database ORMs', () => {
    expect(classifyImports(['mongoose'])).toContain('Persists data to a database')
    expect(classifyImports(['@prisma/client'])).toContain('Persists data to a database')
  })

  it('tags HTTP clients', () => {
    expect(classifyImports(['axios'])).toContain('Makes outbound HTTP requests')
  })

  it('tags message queues', () => {
    expect(classifyImports(['amqplib'])).toContain('Publishes / consumes from a message queue')
    expect(classifyImports(['kafkajs'])).toContain('Publishes / consumes from a message queue')
  })

  it('tags caches', () => {
    expect(classifyImports(['redis'])).toContain('Reads/writes cache')
  })

  it('tags auth libs', () => {
    expect(classifyImports(['jsonwebtoken'])).toContain('Handles authentication or password hashing')
    expect(classifyImports(['bcrypt'])).toContain('Handles authentication or password hashing')
  })

  it('tags logging libs', () => {
    expect(classifyImports(['pino'])).toContain('Emits structured logs')
    expect(classifyImports(['winston'])).toContain('Emits structured logs')
  })

  it('tags crypto', () => {
    expect(classifyImports(['crypto'])).toContain('Performs cryptographic operations')
    expect(classifyImports(['node:crypto'])).toContain('Performs cryptographic operations')
  })

  it('tags observability', () => {
    expect(classifyImports(['@sentry/node'])).toContain('Reports to an observability backend')
  })

  it('dedupes multiple matches of the same category', () => {
    const tags = classifyImports(['mongoose', '@prisma/client', 'typeorm'])
    const dbTagCount = tags.filter((t) => t.includes('Persists')).length
    expect(dbTagCount).toBe(1)
  })

  it('returns empty for unmatched packages', () => {
    expect(classifyImports(['lodash', 'react'])).toEqual([])
  })
})

describe('inferCrossSignals', () => {
  it('flags consumers without tests', () => {
    const result = inferCrossSignals(
      makeAnalysis(),
      { ...emptyGraph, reverseDependencies: ['/a.ts', '/b.ts'] },
      emptyTests,
      emptyGit,
    )
    expect(result.pitfalls.some((p) => p.includes('no related tests'))).toBe(true)
  })

  it('does not flag consumers when tests exist', () => {
    const result = inferCrossSignals(
      makeAnalysis(),
      { ...emptyGraph, reverseDependencies: ['/a.ts'] },
      { ...emptyTests, relatedTests: ['/a.test.ts'] },
      emptyGit,
    )
    expect(result.pitfalls.some((p) => p.includes('no related tests'))).toBe(false)
  })

  it('flags low coverage with many consumers', () => {
    const result = inferCrossSignals(
      makeAnalysis(),
      { ...emptyGraph, reverseDependencies: ['/a.ts', '/b.ts', '/c.ts'] },
      { ...emptyTests, coveragePct: 0.2 },
      emptyGit,
    )
    expect(result.pitfalls.some((p) => p.includes('low coverage'))).toBe(true)
  })

  it('flags volatile files (high churn + many authors)', () => {
    const result = inferCrossSignals(
      makeAnalysis(),
      emptyGraph,
      emptyTests,
      { ...emptyGit, churnScore: 12, authorCount: 4 },
    )
    expect(result.pitfalls.some((p) => p.includes('Volatile'))).toBe(true)
  })

  it('flags side-effectful modules with multiple consumers as invariant', () => {
    const result = inferCrossSignals(
      makeAnalysis({ hasSideEffects: true }),
      { ...emptyGraph, reverseDependencies: ['/a.ts', '/b.ts'] },
      emptyTests,
      emptyGit,
    )
    expect(result.invariants.some((i) => i.includes('side effects at load time'))).toBe(true)
  })

  it('flags env-var deps without tests', () => {
    const result = inferCrossSignals(
      makeAnalysis({ envVars: ['API_KEY'] }),
      emptyGraph,
      emptyTests,
      emptyGit,
    )
    expect(result.pitfalls.some((p) => p.includes('env vars'))).toBe(true)
  })
})

describe('enrichStaticSignals (integration)', () => {
  it('combines filename, imports, and cross-signals', () => {
    const result = enrichStaticSignals(
      makeAnalysis({ externalImports: ['mongoose', 'axios'] }),
      { ...emptyGraph, reverseDependencies: ['/a.ts'] },
      emptyTests,
      emptyGit,
      'src/products/products.service.ts',
    )
    expect(result.purposeHints.some((p) => p.includes('Service'))).toBe(true)
    expect(result.invariantHints.some((i) => i.includes('database'))).toBe(true)
    expect(result.invariantHints.some((i) => i.includes('HTTP'))).toBe(true)
    expect(result.pitfallHints.some((p) => p.includes('no related tests'))).toBe(true)
  })

  it('produces empty hints for a plain utility with no consumers', () => {
    const result = enrichStaticSignals(
      makeAnalysis(),
      emptyGraph,
      emptyTests,
      emptyGit,
      'src/lib/plain.ts',
    )
    expect(result.purposeHints).toEqual([])
    expect(result.invariantHints).toEqual([])
    expect(result.pitfallHints).toEqual([])
  })
})
