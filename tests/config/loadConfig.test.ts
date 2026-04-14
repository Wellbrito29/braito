import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { loadConfig } from '../../src/core/config/loadConfig.ts'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-load-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function writeConfig(body: string): void {
  fs.writeFileSync(path.join(tmpDir, 'ai-notes.config.ts'), body)
}

describe('loadConfig', () => {
  it('returns defaults when ai-notes.config.ts is absent', async () => {
    const config = await loadConfig(tmpDir)
    expect(config.root).toBe(tmpDir)
    expect(config.output).toBe('.ai-notes')
    expect(config.llm).toBeUndefined()
  })

  it('preserves the llm block provided by the user', async () => {
    writeConfig(`
      const config = {
        include: ['**/*.ts'],
        exclude: ['node_modules/**'],
        output: '.ai-notes',
        llm: {
          provider: 'ollama',
          model: 'llama3',
          llmThreshold: 0.3,
          temperature: 0.1,
        },
      }
      export default config
    `)

    const config = await loadConfig(tmpDir)
    expect(config.llm).toBeDefined()
    expect(config.llm!.provider).toBe('ollama')
    expect(config.llm!.model).toBe('llama3')
    expect(config.llm!.llmThreshold).toBe(0.3)
    expect(config.llm!.temperature).toBe(0.1)
  })

  it('preserves maxSourceLines when set', async () => {
    writeConfig(`
      const config = {
        include: ['**/*.ts'],
        exclude: ['node_modules/**'],
        output: '.ai-notes',
        maxSourceLines: 250,
      }
      export default config
    `)

    const config = await loadConfig(tmpDir)
    expect(config.maxSourceLines).toBe(250)
  })

  it('throws a descriptive error when the config is invalid', async () => {
    writeConfig(`
      const config = {
        include: ['**/*.ts'],
        exclude: ['node_modules/**'],
        output: '.ai-notes',
        llm: { provider: 'gemini' },
      }
      export default config
    `)

    await expect(loadConfig(tmpDir)).rejects.toThrow(/Invalid ai-notes\.config\.ts/)
  })
})
