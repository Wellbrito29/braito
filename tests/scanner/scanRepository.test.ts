import { describe, it, expect } from 'bun:test'
import path from 'node:path'
import { scanRepository } from '../../src/core/scanner/scanRepository.ts'
import { withDefaults } from '../../src/core/config/defaults.ts'

const fixturesRoot = path.resolve(import.meta.dir, '../fixtures')

describe('scanRepository', () => {
  it('finds .ts files in the fixtures directory', async () => {
    const config = withDefaults({
      root: fixturesRoot,
      include: ['**/*.ts'],
      exclude: [],
    })

    const files = await scanRepository(config)
    expect(files.length).toBeGreaterThan(0)
    expect(files.every((f) => f.extension === '.ts')).toBe(true)
  })

  it('excludes files matching exclude patterns', async () => {
    const config = withDefaults({
      root: fixturesRoot,
      include: ['**/*.ts'],
      exclude: ['**/sampleHook.ts'],
    })

    const files = await scanRepository(config)
    expect(files.every((f) => !f.relativePath.includes('sampleHook'))).toBe(true)
  })

  it('returns relativePath relative to root', async () => {
    const config = withDefaults({
      root: fixturesRoot,
      include: ['**/*.ts'],
      exclude: [],
    })

    const files = await scanRepository(config)
    expect(files.every((f) => !path.isAbsolute(f.relativePath))).toBe(true)
  })
})
