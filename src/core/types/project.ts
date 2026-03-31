export type DiscoveredFile = {
  path: string
  relativePath: string
  extension: string
  size: number
}

export type LLMProviderName = 'ollama' | 'anthropic' | 'openai'

export type LLMConfig = {
  provider: LLMProviderName
  model?: string
  baseUrl?: string
  llmThreshold?: number
  temperature?: number
  timeoutMs?: number
  concurrency?: number
}

export type AiNotesConfig = {
  root: string
  include: string[]
  exclude: string[]
  output: string
  tsconfigPath?: string
  llm?: LLMConfig
  staleThresholdDays?: number
}
