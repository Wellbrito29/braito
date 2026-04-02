import type { LLMProvider, LLMRequest, LLMResponse } from './types.ts'
import { withRetry } from '../retry.ts'
import { tracer } from '../trace.ts'

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
    const start = Date.now()
    let responseContent = ''
    let ok = true
    let error: string | undefined

    try {
      const response = await withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            stream: false,
            format: 'json',
            options: { temperature: request.temperature ?? 0.2 },
            messages: [
              { role: 'system', content: request.system },
              { role: 'user', content: request.user },
            ],
          }),
        })
        if (!res.ok) {
          throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`)
        }
        return res
      })

      const data = await response.json() as { message: { content: string } }
      responseContent = data.message.content
      return { content: responseContent, model: this.model }
    } catch (err) {
      ok = false
      error = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      tracer.write({
        ts: new Date().toISOString(),
        file: request.file ?? '',
        provider: 'ollama',
        model: this.model,
        prompt: request.user,
        response: responseContent,
        durationMs: Date.now() - start,
        ok,
        error,
      })
    }
  }
}
