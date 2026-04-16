import { describe, it, expect } from 'bun:test'
import { aiNotesConfigSchema, llmConfigSchema } from '../../src/core/config/configSchema.ts'

const BASE = {
  root: '/project',
  include: ['**/*.ts'],
  exclude: ['node_modules/**'],
  output: '.ai-notes',
}

describe('aiNotesConfigSchema', () => {
  it('accepts a minimal valid config', () => {
    const result = aiNotesConfigSchema.safeParse(BASE)
    expect(result.success).toBe(true)
  })

  it('accepts a full valid config', () => {
    const result = aiNotesConfigSchema.safeParse({
      ...BASE,
      tsconfigPath: './tsconfig.json',
      staleThresholdDays: 14,
      llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4, temperature: 0.2 },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty include array', () => {
    const result = aiNotesConfigSchema.safeParse({ ...BASE, include: [] })
    expect(result.success).toBe(false)
  })

  it('rejects empty output string', () => {
    const result = aiNotesConfigSchema.safeParse({ ...BASE, output: '' })
    expect(result.success).toBe(false)
  })

  it('rejects non-positive staleThresholdDays', () => {
    const result = aiNotesConfigSchema.safeParse({ ...BASE, staleThresholdDays: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer staleThresholdDays', () => {
    const result = aiNotesConfigSchema.safeParse({ ...BASE, staleThresholdDays: 1.5 })
    expect(result.success).toBe(false)
  })
})

describe('llmConfigSchema', () => {
  it('accepts ollama provider', () => {
    const result = llmConfigSchema.safeParse({ provider: 'ollama', model: 'llama3' })
    expect(result.success).toBe(true)
  })

  it('accepts anthropic provider', () => {
    const result = llmConfigSchema.safeParse({ provider: 'anthropic', apiKey: 'sk-test' })
    expect(result.success).toBe(true)
  })

  it('accepts openai provider', () => {
    const result = llmConfigSchema.safeParse({ provider: 'openai', apiKey: 'sk-test' })
    expect(result.success).toBe(true)
  })

  it('accepts claude-cli provider', () => {
    const result = llmConfigSchema.safeParse({ provider: 'claude-cli' })
    expect(result.success).toBe(true)
  })

  it('rejects unknown provider', () => {
    const result = llmConfigSchema.safeParse({ provider: 'gemini' })
    expect(result.success).toBe(false)
  })

  it('rejects llmThreshold > 1', () => {
    const result = llmConfigSchema.safeParse({ provider: 'ollama', llmThreshold: 1.5 })
    expect(result.success).toBe(false)
  })

  it('rejects llmThreshold < 0', () => {
    const result = llmConfigSchema.safeParse({ provider: 'ollama', llmThreshold: -0.1 })
    expect(result.success).toBe(false)
  })

  it('rejects temperature > 2', () => {
    const result = llmConfigSchema.safeParse({ provider: 'ollama', temperature: 2.1 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid baseUrl', () => {
    const result = llmConfigSchema.safeParse({ provider: 'ollama', baseUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('accepts valid baseUrl', () => {
    const result = llmConfigSchema.safeParse({ provider: 'ollama', baseUrl: 'http://localhost:11434' })
    expect(result.success).toBe(true)
  })
})
