import { describe, it, expect } from 'bun:test'
import { concurrentMap } from '../../src/core/utils/concurrentMap.ts'

describe('concurrentMap', () => {
  it('processes all items', async () => {
    const items = [1, 2, 3, 4, 5]
    const results = await concurrentMap(items, async (x) => x * 2, 3)
    expect(results).toHaveLength(5)
    expect(results.every((r) => r !== undefined)).toBe(true)
  })

  it('preserves order of results', async () => {
    const items = [1, 2, 3, 4, 5]
    // Each item resolves after a delay inversely proportional to its value,
    // so smaller numbers finish last — a sequential loop would get them out of order.
    const results = await concurrentMap(
      items,
      async (x) => {
        await new Promise((resolve) => setTimeout(resolve, (6 - x) * 10))
        return x * 10
      },
      5,
    )
    expect(results).toEqual([10, 20, 30, 40, 50])
  })

  it('limits the number of concurrent executions', async () => {
    const concurrency = 3
    let active = 0
    let maxActive = 0

    const items = Array.from({ length: 10 }, (_, i) => i)
    await concurrentMap(
      items,
      async (_item) => {
        active++
        if (active > maxActive) maxActive = active
        await new Promise((resolve) => setTimeout(resolve, 20))
        active--
      },
      concurrency,
    )

    expect(maxActive).toBeLessThanOrEqual(concurrency)
  })

  it('handles an empty array', async () => {
    const results = await concurrentMap([], async (x: number) => x, 5)
    expect(results).toEqual([])
  })

  it('handles concurrency larger than item count', async () => {
    const items = [1, 2]
    const results = await concurrentMap(items, async (x) => x + 100, 10)
    expect(results).toEqual([101, 102])
  })

  it('passes both item and index to the callback', async () => {
    const items = ['a', 'b', 'c']
    const results = await concurrentMap(items, async (item, index) => `${index}:${item}`, 2)
    expect(results).toEqual(['0:a', '1:b', '2:c'])
  })
})
