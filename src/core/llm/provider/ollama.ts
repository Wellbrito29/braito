import type { LLMProvider, LLMRequest, LLMResponse } from './types.ts'

const DEFAULT_BASE_URL = 'http://localhost:11434'
const DEFAULT_MODEL = 'llama3'

export class OllamaProvider implements LLMProvider {
  private baseUrl: string
  private model: string

  constructor(opts: { baseUrl?: string; model?: string } = {}) {
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL
    this.model = opts.model ?? DEFAULT_MODEL
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        options: { temperature: request.temperature ?? 0.2 },
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as { message: { content: string } }
    return { content: data.message.content, model: this.model }
  }
}
