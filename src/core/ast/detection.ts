import type { AnalysisConfig } from '../types/project.ts'

/**
 * Default package-name substrings that flag a module as having runtime side
 * effects on import. Covers observability, message queues, schedulers, realtime
 * channels, analytics, feature flags and other common infrastructure clients.
 *
 * This is intentionally a HINT, not a gate — it biases the purpose section
 * ("may publish to message queue") but never drives criticality on its own.
 * Teams extend this via `analysis.sideEffectPackages` in ai-notes.config.ts.
 */
export const DEFAULT_SIDE_EFFECT_PACKAGES: string[] = [
  // Observability / monitoring
  'sentry', 'datadog', 'newrelic', 'honeycomb', 'opentelemetry',
  'prometheus', 'elastic-apm', 'rollbar', 'bugsnag',
  // Analytics / product telemetry
  'analytics', 'mixpanel', 'amplitude', 'segment', 'posthog',
  'google-analytics', 'gtag',
  // Message queues / event buses
  'amqp', 'amqplib', 'rabbitmq', 'kafkajs', 'kafka', 'nats',
  'sqs', 'pubsub', 'eventbridge', 'servicebus',
  // Schedulers / background jobs
  'bullmq', 'bull', 'agenda', 'node-cron', 'bree',
  // Realtime / long-lived channels
  'socket.io', 'ws', 'sockjs',
  // Cache / KV that often trigger eager connections
  'ioredis', 'redis', 'memcached',
  // Platform SDKs with eager side effects
  'firebase', 'firebase-admin',
  // Feature flags / experimentation
  'launchdarkly', 'growthbook', 'unleash', 'optimizely',
]

/**
 * Default regex fragments for detecting outbound API / network calls in
 * source text. Each fragment is a complete regex body, including any needed
 * group structure. They are alternated into a single pattern at call time.
 */
export const DEFAULT_API_CALL_PATTERNS: string[] = [
  // fetch('…'), axios('…'), got('…'), request('…')
  "(?:fetch|axios|got|request|ky|undici)\\s*\\(\\s*['\"`]([^'\"`]+)['\"`]",
  // axios.get('…'), axios.post('…') — captures the URL
  "(?:axios|got|ky)\\.(?:get|post|put|patch|delete|head)\\s*\\(\\s*['\"`]([^'\"`]+)['\"`]",
]

/**
 * Merge user-supplied side-effect packages with the defaults, preserving
 * order and removing duplicates (case-insensitive).
 */
export function resolveSideEffectPackages(config?: AnalysisConfig): string[] {
  const extras = config?.sideEffectPackages ?? []
  const merged: string[] = []
  const seen = new Set<string>()
  for (const pkg of [...DEFAULT_SIDE_EFFECT_PACKAGES, ...extras]) {
    const key = pkg.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(pkg)
  }
  return merged
}

export function hasSideEffectImport(
  externalImports: readonly string[],
  packages: readonly string[],
): boolean {
  if (packages.length === 0) return false
  return externalImports.some((imp) => {
    const lower = imp.toLowerCase()
    return packages.some((pkg) => lower.includes(pkg.toLowerCase()))
  })
}

/**
 * Build the alternated regex used by API-call extraction. Returns `null`
 * when no valid patterns remain (defensive — schema validation already
 * rejects bad user input).
 */
export function buildApiCallRegex(config?: AnalysisConfig): RegExp | null {
  const extras = config?.apiCallPatterns ?? []
  const fragments = [...DEFAULT_API_CALL_PATTERNS, ...extras].filter(Boolean)
  if (fragments.length === 0) return null
  try {
    return new RegExp(fragments.map((f) => `(?:${f})`).join('|'), 'g')
  } catch {
    return new RegExp(DEFAULT_API_CALL_PATTERNS.map((f) => `(?:${f})`).join('|'), 'g')
  }
}

/**
 * Run the merged API-call regex over text and return the unique captured URLs.
 * Handles the alternation group structure — we pick the first defined capture
 * group on each match, which is the URL-like payload for every built-in pattern.
 */
export function extractApiCallUrls(text: string, regex: RegExp): string[] {
  const urls = new Set<string>()
  for (const match of text.matchAll(regex)) {
    const url = match.slice(1).find((g) => typeof g === 'string' && g.length > 0)
    if (url) urls.add(url)
  }
  return [...urls]
}
