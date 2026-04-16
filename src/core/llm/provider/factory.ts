import type { LLMProvider } from './types.ts'
import type { LLMConfig } from '../../types/project.ts'
import { OllamaProvider } from './ollama.ts'
import { AnthropicProvider } from './anthropic.ts'
import { OpenAIProvider } from './openai.ts'
import { ClaudeCliProvider } from './claude-cli.ts'

export function createProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider({
        baseUrl: config.baseUrl,
        model: config.model,
      })

    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('Anthropic provider requires ANTHROPIC_API_KEY env var')
      return new AnthropicProvider({ apiKey, model: config.model })
    }

    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) throw new Error('OpenAI provider requires OPENAI_API_KEY env var')
      return new OpenAIProvider({ apiKey, model: config.model })
    }

    case 'claude-cli':
      return new ClaudeCliProvider({ model: config.model })

    default:
      throw new Error(`Unknown LLM provider: ${(config as LLMConfig).provider}`)
  }
}
