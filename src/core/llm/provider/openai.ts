import type { LLMProvider, LLMRequest, LLMResponse } from './types.ts'
import { withRetry } from '../retry.ts'

const DEFAULT_MODEL = 'gpt-4o'

export class OpenAIProvider implements LLMProvider {
  private apiKey: string
  private model: string

  constructor(opts: { apiKey: string; model?: string }) {
    this.apiKey = opts.apiKey
    this.model = opts.model ?? DEFAULT_MODEL
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Dynamic import so openai SDK is truly optional
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey: this.apiKey })

    const completion = await withRetry(() =>
      client.chat.completions.create({
        model: this.model,
        temperature: request.temperature ?? 0.2,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
      }),
    )

    const content = completion.choices[0]?.message.content ?? ''
    return { content, model: this.model }
  }
}
