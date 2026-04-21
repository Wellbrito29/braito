import path from 'node:path'
import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../types/file-analysis.ts'

export type StaticEnrichment = {
  purposeHints: string[]
  invariantHints: string[]
  pitfallHints: string[]
}

type FilenamePattern = { match: (name: string, segs: string[]) => boolean; label: string }

const FILENAME_PATTERNS: FilenamePattern[] = [
  // NestJS / layered backend
  { match: (n) => /\.controller\.(ts|js)$/.test(n), label: 'HTTP controller — handles incoming requests' },
  { match: (n) => /\.service\.(ts|js)$/.test(n), label: 'Service — encapsulates business logic for an injected consumer' },
  { match: (n) => /\.module\.(ts|js)$/.test(n), label: 'NestJS module — wires providers, controllers, and imports' },
  { match: (n) => /\.guard\.(ts|js)$/.test(n), label: 'Route guard — gates access to endpoints' },
  { match: (n) => /\.interceptor\.(ts|js)$/.test(n), label: 'Request/response interceptor' },
  { match: (n) => /\.filter\.(ts|js)$/.test(n), label: 'Exception filter — translates thrown errors into HTTP responses' },
  { match: (n) => /\.middleware\.(ts|js)$/.test(n), label: 'HTTP middleware — runs on every matching request' },
  { match: (n) => /\.pipe\.(ts|js)$/.test(n), label: 'Request pipe — validates/transforms incoming payloads' },
  { match: (n) => /\.decorator\.(ts|js)$/.test(n), label: 'Custom decorator' },
  { match: (n) => /\.strategy\.(ts|js)$/.test(n), label: 'Strategy implementation (often Passport)' },
  { match: (n) => /\.repository\.(ts|js)$/.test(n), label: 'Data access layer — wraps persistence calls' },
  { match: (n) => /\.dao\.(ts|js)$/.test(n), label: 'Data access object' },
  { match: (n) => /\.(use-case|usecase)\.(ts|js)$/.test(n), label: 'Use case — orchestrates a single business action' },
  { match: (_, s) => s.includes('use-cases') || s.includes('usecases'), label: 'Use case — orchestrates a single business action' },
  { match: (n) => /\.entity\.(ts|js)$/.test(n), label: 'Domain entity / persistence model' },
  { match: (n) => /\.model\.(ts|js)$/.test(n), label: 'Domain model' },
  { match: (n) => /\.dto\.(ts|js)$/.test(n), label: 'Data transfer object — external/internal payload shape' },
  { match: (n) => /\.enum\.(ts|js)$/.test(n), label: 'Enumeration — closed set of allowed values' },
  { match: (n) => /\.(interface|types?)\.(ts|js)$/.test(n), label: 'Type / interface definitions' },
  { match: (n) => /\.schema\.(ts|js)$/.test(n), label: 'Schema definition (validation or persistence)' },
  { match: (n) => /\.config\.(ts|js)$/.test(n), label: 'Configuration module' },
  { match: (n) => /\.(constants?|enums?)\.(ts|js)$/.test(n), label: 'Constants / enum set' },
  // Tests
  { match: (n) => /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(n), label: 'Test suite' },
  { match: (n) => /\.mock\.(ts|js)$/.test(n) || n.startsWith('__mocks__/'), label: 'Test double / mock' },
  { match: (n) => /\.fixtures?\.(ts|js)$/.test(n), label: 'Test fixtures' },
  // React / hooks
  { match: (n) => /^use[A-Z][A-Za-z0-9]*\.(ts|js|tsx|jsx)$/.test(path.basename(n)), label: 'React hook' },
  { match: (n) => /\.(jsx|tsx)$/.test(n), label: 'React component' },
  // Generic
  { match: (n, s) => path.basename(n).replace(/\.(ts|js)$/, '') === 'index' && s.length >= 2, label: 'Barrel export — public API of the enclosing directory' },
  { match: (n) => /\.util\.(ts|js)$/.test(n) || /\.helpers?\.(ts|js)$/.test(n), label: 'Utility module — pure helpers' },
  { match: (n) => /\.validator\.(ts|js)$/.test(n), label: 'Validator — input validation logic' },
  { match: (n) => /\.mapper\.(ts|js)$/.test(n) || /\.transformer\.(ts|js)$/.test(n), label: 'Mapper — translates between representations' },
  { match: (_, s) => s.some((x) => /^(migrations?)$/.test(x)), label: 'Database migration' },
  { match: (_, s) => s.some((x) => /^seeds?$/.test(x)), label: 'Database seed data' },
]

/** Pick a classification from the filename + directory segments. First match wins. */
export function classifyByFilename(filePath: string): string | null {
  const segs = filePath.split('/')
  const name = segs[segs.length - 1]
  for (const p of FILENAME_PATTERNS) {
    if (p.match(filePath, segs) || p.match(name, segs)) return p.label
  }
  return null
}

// Import-path → semantic category. Matched as prefix OR exact.
type ImportCategory = { match: (pkg: string) => boolean; label: string }

const IMPORT_CATEGORIES: ImportCategory[] = [
  { match: (p) => ['winston', 'pino', 'bunyan', 'log4js', 'loglevel'].includes(p), label: 'Emits structured logs' },
  { match: (p) => ['mongoose', 'typeorm', 'sequelize', '@prisma/client', 'prisma', 'knex', 'drizzle-orm', 'mikro-orm', '@mikro-orm/core'].some((x) => p === x || p.startsWith(x + '/')), label: 'Persists data to a database' },
  { match: (p) => ['axios', 'got', 'node-fetch', 'superagent', 'undici', 'ky', 'cross-fetch'].includes(p), label: 'Makes outbound HTTP requests' },
  { match: (p) => ['amqplib', 'amqp-connection-manager', '@golevelup/nestjs-rabbitmq', 'kafkajs', 'nats', 'bullmq', 'bull', '@aws-sdk/client-sqs', '@google-cloud/pubsub'].some((x) => p === x || p.startsWith(x + '/')), label: 'Publishes / consumes from a message queue' },
  { match: (p) => ['redis', 'ioredis', 'memcached', 'keyv', 'cache-manager'].includes(p), label: 'Reads/writes cache' },
  { match: (p) => ['jsonwebtoken', 'jose', 'passport', 'passport-jwt', 'bcrypt', 'bcryptjs', 'argon2', '@nestjs/jwt', '@nestjs/passport'].some((x) => p === x || p.startsWith(x + '/')), label: 'Handles authentication or password hashing' },
  { match: (p) => ['express', 'fastify', 'koa', 'hono', '@hapi/hapi', 'restify'].some((x) => p === x || p.startsWith(x + '/')), label: 'HTTP framework entry point' },
  { match: (p) => p === 'crypto' || p === 'node:crypto' || p === 'node-forge' || p === 'tweetnacl', label: 'Performs cryptographic operations' },
  { match: (p) => p === 'fs' || p === 'node:fs' || p === 'fs-extra' || p === 'graceful-fs', label: 'Reads or writes files' },
  { match: (p) => ['child_process', 'node:child_process', 'execa', 'cross-spawn'].includes(p), label: 'Spawns child processes' },
  { match: (p) => ['@sentry/node', '@sentry/nextjs', '@datadog/browser-rum', '@datadog/browser-logs', 'dd-trace', 'newrelic', '@opentelemetry/api', 'honeycomb-beeline', '@honeycombio/opentelemetry-node'].some((x) => p === x || p.startsWith(x + '/')), label: 'Reports to an observability backend' },
  { match: (p) => ['mixpanel', 'amplitude', '@segment/analytics-node', 'posthog-js', 'posthog-node'].some((x) => p === x || p.startsWith(x + '/')), label: 'Emits product analytics events' },
  { match: (p) => ['launchdarkly-node-server-sdk', '@growthbook/growthbook', 'unleash-client', '@optimizely/optimizely-sdk'].some((x) => p === x || p.startsWith(x + '/')), label: 'Reads feature flags' },
  { match: (p) => ['socket.io', 'ws', 'socket.io-client', 'uWebSockets.js'].some((x) => p === x || p.startsWith(x + '/')), label: 'Handles realtime (websocket) traffic' },
]

/** Return unique category labels triggered by the import list. */
export function classifyImports(externalImports: string[]): string[] {
  const hits = new Set<string>()
  for (const imp of externalImports) {
    for (const cat of IMPORT_CATEGORIES) {
      if (cat.match(imp)) hits.add(cat.label)
    }
  }
  return [...hits]
}

/** Cross-signal inferences — facts only obvious when multiple subsystems agree. */
export function inferCrossSignals(
  analysis: StaticFileAnalysis,
  graph: GraphSignals,
  tests: TestSignals,
  git: GitSignals,
): { pitfalls: string[]; invariants: string[] } {
  const pitfalls: string[] = []
  const invariants: string[] = []

  const consumerCount = graph.reverseDependencies.length
  const hasTests = tests.relatedTests.length > 0
  const coverage = tests.coveragePct

  if (consumerCount >= 1 && !hasTests) {
    pitfalls.push(
      `Consumed by ${consumerCount} file${consumerCount === 1 ? '' : 's'} but has no related tests — changes propagate untested`,
    )
  }

  if (consumerCount >= 3 && coverage !== undefined && coverage < 0.5) {
    pitfalls.push(
      `${consumerCount} consumers with low coverage (${(coverage * 100).toFixed(0)}%) — high regression blast radius`,
    )
  }

  if (analysis.envVars.length > 0 && !hasTests) {
    pitfalls.push('Depends on env vars but has no related tests — behavior changes silently by environment')
  }

  // Volatile file: high churn + multiple authors = shared, fast-moving territory
  if (git.churnScore >= 10 && git.authorCount >= 3) {
    pitfalls.push(
      `Volatile: ${git.churnScore} recent commits by ${git.authorCount} authors — expect conflicts and drift`,
    )
  }

  if (analysis.hasSideEffects && consumerCount >= 2) {
    invariants.push(
      `Importing this module runs side effects at load time — every one of the ${consumerCount} consumers triggers them`,
    )
  }

  return { pitfalls, invariants }
}

/** Main entry point — returns the three hint buckets, ready to merge into observed[]. */
export function enrichStaticSignals(
  analysis: StaticFileAnalysis,
  graph: GraphSignals,
  tests: TestSignals,
  git: GitSignals,
  relPath: string,
): StaticEnrichment {
  const purposeHints: string[] = []
  const invariantHints: string[] = []
  const pitfallHints: string[] = []

  const classification = classifyByFilename(relPath)
  if (classification) purposeHints.push(classification)

  const importTags = classifyImports(analysis.externalImports)
  for (const tag of importTags) invariantHints.push(tag)

  const { pitfalls, invariants } = inferCrossSignals(analysis, graph, tests, git)
  for (const p of pitfalls) pitfallHints.push(p)
  for (const i of invariants) invariantHints.push(i)

  return { purposeHints, invariantHints, pitfallHints }
}
