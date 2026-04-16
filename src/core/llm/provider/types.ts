export type LLMRequest = {
  system: string
  user: string
  temperature?: number
}

export type LLMResponse = {
  content: string
  model: string
  usage?: LLMUsage
}

export type LLMUsage = {
  durationMs?: number
  costUsd?: number
}

export interface LLMProvider {
  complete(request: LLMRequest): Promise<LLMResponse>
}
