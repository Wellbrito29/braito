import type { LLMProvider, LLMRequest, LLMResponse } from './types.ts'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

export class AnthropicProvider implements LLMProvider {
  private apiKey: string
  private model: string

  constructor(opts: { apiKey: string; model?: string }) {
    this.apiKey = opts.apiKey
    this.model = opts.model ?? DEFAULT_MODEL
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Dynamic import so @anthropic-ai/sdk is truly optional
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: this.apiKey })

    const message = await client.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: request.temperature ?? 0.2,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
    })

    const content = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    return { content, model: this.model }
  }
}
