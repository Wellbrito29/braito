import { describe, it, expect } from 'bun:test'
import {
  DEFAULT_API_CALL_PATTERNS,
  DEFAULT_SIDE_EFFECT_PACKAGES,
  buildApiCallRegex,
  extractApiCallUrls,
  hasSideEffectImport,
  resolveSideEffectPackages,
} from '../../src/core/ast/detection.ts'

describe('resolveSideEffectPackages', () => {
  it('returns the built-in defaults when no config is given', () => {
    const result = resolveSideEffectPackages()
    expect(result).toEqual(DEFAULT_SIDE_EFFECT_PACKAGES)
  })

  it('merges user packages without duplicating built-ins', () => {
    const result = resolveSideEffectPackages({ sideEffectPackages: ['my-tracing', 'sentry'] })
    expect(result).toContain('my-tracing')
    expect(result.filter((p) => p === 'sentry')).toHaveLength(1)
  })

  it('is case-insensitive when deduplicating', () => {
    const result = resolveSideEffectPackages({ sideEffectPackages: ['SENTRY', 'Datadog'] })
    expect(result.filter((p) => p.toLowerCase() === 'sentry')).toHaveLength(1)
    expect(result.filter((p) => p.toLowerCase() === 'datadog')).toHaveLength(1)
  })
})

describe('hasSideEffectImport', () => {
  it('detects a queue client by package name substring', () => {
    expect(hasSideEffectImport(['amqplib', '@nestjs/common'], resolveSideEffectPackages())).toBe(true)
  })

  it('detects a scheduler (bullmq) as side effect', () => {
    expect(hasSideEffectImport(['bullmq'], resolveSideEffectPackages())).toBe(true)
  })

  it('detects observability libs (sentry, datadog)', () => {
    expect(hasSideEffectImport(['@sentry/node'], resolveSideEffectPackages())).toBe(true)
    expect(hasSideEffectImport(['dd-trace', 'datadog-metrics'], resolveSideEffectPackages())).toBe(true)
  })

  it('ignores imports that do not match any package', () => {
    expect(hasSideEffectImport(['lodash', 'dayjs'], resolveSideEffectPackages())).toBe(false)
  })

  it('honors user-configured packages', () => {
    const pkgs = resolveSideEffectPackages({ sideEffectPackages: ['my-corp-tracing'] })
    expect(hasSideEffectImport(['my-corp-tracing'], pkgs)).toBe(true)
  })

  it('returns false when the package list is empty', () => {
    expect(hasSideEffectImport(['anything'], [])).toBe(false)
  })
})

describe('buildApiCallRegex + extractApiCallUrls', () => {
  it('extracts fetch-style URLs by default', () => {
    const rx = buildApiCallRegex()!
    const text = `const r = await fetch('https://api.example.com/items')`
    expect(extractApiCallUrls(text, rx)).toEqual(['https://api.example.com/items'])
  })

  it('extracts axios.get/post URLs via the default pattern', () => {
    const rx = buildApiCallRegex()!
    const text = `axios.get('https://a.com/x'); axios.post('https://a.com/y', body)`
    expect(extractApiCallUrls(text, rx).sort()).toEqual(['https://a.com/x', 'https://a.com/y'])
  })

  it('honors user-supplied apiCallPatterns', () => {
    const rx = buildApiCallRegex({
      apiCallPatterns: ["httpClient\\.request\\s*\\(\\s*['\"]([^'\"]+)['\"]"],
    })!
    const text = `httpClient.request('/internal/route', { method: 'GET' })`
    expect(extractApiCallUrls(text, rx)).toContain('/internal/route')
  })

  it('dedupes repeated URLs', () => {
    const rx = buildApiCallRegex()!
    const text = `fetch('https://a.com/x'); fetch('https://a.com/x')`
    expect(extractApiCallUrls(text, rx)).toEqual(['https://a.com/x'])
  })

  it('has built-in defaults available', () => {
    expect(DEFAULT_API_CALL_PATTERNS.length).toBeGreaterThan(0)
  })
})
