import { describe, it, expect } from 'bun:test'
import { createProvider } from '../../src/core/llm/provider/factory.ts'
import { OllamaProvider } from '../../src/core/llm/provider/ollama.ts'

describe('createProvider', () => {
  it('creates an OllamaProvider for provider "ollama"', () => {
    const provider = createProvider({ provider: 'ollama', model: 'llama3' })
    expect(provider).toBeInstanceOf(OllamaProvider)
  })

  it('throws for anthropic without apiKey', () => {
    const orig = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    expect(() => createProvider({ provider: 'anthropic' })).toThrow()
    process.env.ANTHROPIC_API_KEY = orig
  })

  it('throws for openai without apiKey', () => {
    const orig = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    expect(() => createProvider({ provider: 'openai' })).toThrow()
    process.env.OPENAI_API_KEY = orig
  })
})
