import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { ProgressBar } from '../../src/core/utils/progress.ts'

describe('ProgressBar', () => {
  let stderrWrite: typeof process.stderr.write
  let written: string[]

  beforeEach(() => {
    written = []
    stderrWrite = process.stderr.write.bind(process.stderr)
    process.stderr.write = ((chunk: string) => {
      written.push(chunk)
      return true
    }) as typeof process.stderr.write
  })

  afterEach(() => {
    process.stderr.write = stderrWrite
  })

  it('tick() increments current correctly', () => {
    // Use isTTY true to observe the output
    const originalIsTTY = process.stderr.isTTY
    ;(process.stderr as { isTTY: boolean }).isTTY = true

    const bar = new ProgressBar(5, 'Testing')
    bar.tick('file1.ts')
    bar.tick('file2.ts')

    // Current should be 2 out of 5 → 40%
    const lastLine = written[written.length - 1]
    expect(lastLine).toContain('(2/5)')
    expect(lastLine).toContain('40%')

    ;(process.stderr as { isTTY: boolean }).isTTY = originalIsTTY
  })

  it('does not write to stderr when not TTY', () => {
    const originalIsTTY = process.stderr.isTTY
    ;(process.stderr as { isTTY: boolean }).isTTY = false

    const bar = new ProgressBar(3, 'Silent')
    bar.tick('a.ts')
    bar.tick('b.ts')
    bar.tick('c.ts')

    expect(written).toHaveLength(0)

    ;(process.stderr as { isTTY: boolean }).isTTY = originalIsTTY
  })

  it('writes a newline when the last item is ticked', () => {
    const originalIsTTY = process.stderr.isTTY
    ;(process.stderr as { isTTY: boolean }).isTTY = true

    const bar = new ProgressBar(2, 'Finishing')
    bar.tick('first.ts')
    const beforeLast = written.length

    bar.tick('last.ts')

    // After the final tick there should be an extra newline write
    expect(written.length).toBeGreaterThan(beforeLast)
    const newlineWrite = written[written.length - 1]
    expect(newlineWrite).toBe('\n')

    ;(process.stderr as { isTTY: boolean }).isTTY = originalIsTTY
  })

  it('clear() does not throw when not TTY', () => {
    const originalIsTTY = process.stderr.isTTY
    ;(process.stderr as { isTTY: boolean }).isTTY = false

    const bar = new ProgressBar(1)
    expect(() => bar.clear()).not.toThrow()

    ;(process.stderr as { isTTY: boolean }).isTTY = originalIsTTY
  })

  it('clear() does not throw when TTY', () => {
    const originalIsTTY = process.stderr.isTTY
    ;(process.stderr as { isTTY: boolean }).isTTY = true

    const bar = new ProgressBar(1)
    expect(() => bar.clear()).not.toThrow()

    ;(process.stderr as { isTTY: boolean }).isTTY = originalIsTTY
  })

  it('100% progress bar shows all filled blocks', () => {
    const originalIsTTY = process.stderr.isTTY
    ;(process.stderr as { isTTY: boolean }).isTTY = true

    const bar = new ProgressBar(1, 'Full')
    bar.tick('done.ts')

    const progressLine = written.find((w) => w.startsWith('\r'))
    expect(progressLine).toBeDefined()
    expect(progressLine).toContain('100%')
    expect(progressLine).toContain('(1/1)')
    // All 20 blocks should be filled
    expect(progressLine).toContain('█'.repeat(20))

    ;(process.stderr as { isTTY: boolean }).isTTY = originalIsTTY
  })
})
