import { describe, it, expect } from 'bun:test'
import { isTransientError, withRetry } from '../../src/core/llm/retry.ts'

describe('isTransientError', () => {
  it('identifies 429 rate limit errors as transient', () => {
    expect(isTransientError(new Error('Request failed with status 429'))).toBe(true)
  })

  it('identifies rate limit message as transient', () => {
    expect(isTransientError(new Error('Rate limit exceeded, please slow down'))).toBe(true)
  })

  it('identifies rate-limit (hyphenated) as transient', () => {
    expect(isTransientError(new Error('rate-limit hit'))).toBe(true)
  })

  it('identifies timeout errors as transient', () => {
    expect(isTransientError(new Error('Request timeout after 30s'))).toBe(true)
  })

  it('identifies network errors as transient', () => {
    expect(isTransientError(new Error('network error occurred'))).toBe(true)
  })

  it('identifies ECONNRESET as transient', () => {
    expect(isTransientError(new Error('read ECONNRESET'))).toBe(true)
  })

  it('identifies ETIMEDOUT as transient', () => {
    expect(isTransientError(new Error('connect ETIMEDOUT 192.168.1.1:443'))).toBe(true)
  })

  it('identifies 401 unauthorized as permanent', () => {
    expect(isTransientError(new Error('401 Unauthorized'))).toBe(false)
  })

  it('identifies validation errors as permanent', () => {
    expect(isTransientError(new Error('Invalid request: missing required field'))).toBe(false)
  })

  it('identifies 403 forbidden as permanent', () => {
    expect(isTransientError(new Error('403 Forbidden'))).toBe(false)
  })

  it('handles non-Error values', () => {
    expect(isTransientError('429 too many requests')).toBe(true)
    expect(isTransientError('unauthorized')).toBe(false)
  })
})

describe('withRetry', () => {
  it('returns the result immediately on success', async () => {
    let calls = 0
    const result = await withRetry(async () => {
      calls++
      return 'ok'
    }, 3, 0)
    expect(result).toBe('ok')
    expect(calls).toBe(1)
  })

  it('retries on transient errors and succeeds on second attempt', async () => {
    let calls = 0
    const result = await withRetry(
      async () => {
        calls++
        if (calls === 1) throw new Error('429 rate limit')
        return 'success'
      },
      3,
      0,
    )
    expect(result).toBe('success')
    expect(calls).toBe(2)
  })

  it('retries on timeout and succeeds on third attempt', async () => {
    let calls = 0
    const result = await withRetry(
      async () => {
        calls++
        if (calls < 3) throw new Error('Request timeout')
        return 'done'
      },
      3,
      0,
    )
    expect(result).toBe('done')
    expect(calls).toBe(3)
  })

  it('does NOT retry on permanent errors', async () => {
    let calls = 0
    await expect(
      withRetry(
        async () => {
          calls++
          throw new Error('401 Unauthorized')
        },
        3,
        0,
      ),
    ).rejects.toThrow('401 Unauthorized')
    expect(calls).toBe(1)
  })

  it('throws after maxRetries exhaustion for transient errors', async () => {
    let calls = 0
    await expect(
      withRetry(
        async () => {
          calls++
          throw new Error('429 rate limit')
        },
        3,
        0,
      ),
    ).rejects.toThrow('429 rate limit')
    // 1 initial attempt + 3 retries = 4 total calls
    expect(calls).toBe(4)
  })

  it('respects maxRetries = 0 (no retries)', async () => {
    let calls = 0
    await expect(
      withRetry(
        async () => {
          calls++
          throw new Error('network error')
        },
        0,
        0,
      ),
    ).rejects.toThrow('network error')
    expect(calls).toBe(1)
  })
})
