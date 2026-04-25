export type DiscoveredFile = {
  path: string
  relativePath: string
  extension: string
  size: number
}

export type LLMProviderName = 'ollama' | 'anthropic' | 'openai' | 'claude-cli' | 'codex'

export type LLMConfig = {
  provider: LLMProviderName
  model?: string
  /**
   * Optional premium model used for files whose criticality score is >= `highThreshold`.
   * Lets teams spend budget on the riskiest files (e.g. claude-opus-4-6) while keeping
   * the default model (claude-sonnet-4-6) for everything else. Requires `highThreshold`.
   */
  highModel?: string
  /**
   * Criticality threshold at which `highModel` kicks in. Defaults to 0.7 when `highModel`
   * is set but `highThreshold` is omitted. Ignored when `highModel` is not set.
   */
  highThreshold?: number
  baseUrl?: string
  llmThreshold?: number
  temperature?: number
  timeoutMs?: number
  concurrency?: number
}

/**
 * Static-analysis tuning. These let teams teach braito about their internal
 * SDKs without forking the codebase. Entries are merged with the built-in
 * defaults, so users only need to declare additions.
 */
export type AnalysisConfig = {
  /**
   * Extra package-name substrings that indicate a module has runtime side
   * effects when imported (tracing, queues, schedulers, feature flags, etc.).
   * Matched as substrings against external imports, case-insensitive.
   */
  sideEffectPackages?: string[]
  /**
   * Extra regex fragments used to detect outbound API/network calls in source
   * text. Each fragment is wrapped in a group and alternated with the built-in
   * patterns. Example: `"myHttpClient\\\\.(get|post)"`.
   */
  apiCallPatterns?: string[]
}

export type AiNotesConfig = {
  root: string
  include: string[]
  exclude: string[]
  output: string
  tsconfigPath?: string
  llm?: LLMConfig
  maxSourceLines?: number
  staleThresholdDays?: number
  language?: string  // BCP 47 language tag — e.g. 'en', 'pt-BR', 'es'. Default: 'en'
  analysis?: AnalysisConfig
}
