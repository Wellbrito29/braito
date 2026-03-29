export type LLMRequest = {
  system: string
  user: string
  temperature?: number
}

export type LLMResponse = {
  content: string
  model: string
}

export interface LLMProvider {
  complete(request: LLMRequest): Promise<LLMResponse>
}
