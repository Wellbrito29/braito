import { z } from 'zod'

export const llmConfigSchema = z.object({
  provider: z.enum(['ollama', 'anthropic', 'openai', 'claude-cli'], {
    errorMap: () => ({
      message: "llm.provider must be 'ollama', 'anthropic', 'openai', or 'claude-cli'",
    }),
  }),
  model: z.string().optional(),
  highModel: z.string().optional(),
  highThreshold: z
    .number()
    .min(0, 'llm.highThreshold must be >= 0')
    .max(1, 'llm.highThreshold must be <= 1')
    .optional(),
  baseUrl: z.string().url({ message: 'llm.baseUrl must be a valid URL' }).optional(),
  llmThreshold: z
    .number()
    .min(0, 'llm.llmThreshold must be >= 0')
    .max(1, 'llm.llmThreshold must be <= 1')
    .optional(),
  temperature: z
    .number()
    .min(0, 'llm.temperature must be >= 0')
    .max(2, 'llm.temperature must be <= 2')
    .optional(),
  timeoutMs: z.number().int().positive().optional(),
  concurrency: z.number().int().min(1).max(20).optional(),
})

export const analysisConfigSchema = z.object({
  sideEffectPackages: z.array(z.string().min(1)).optional(),
  apiCallPatterns: z
    .array(
      z.string().refine(
        (s) => {
          try {
            new RegExp(s)
            return true
          } catch {
            return false
          }
        },
        { message: 'analysis.apiCallPatterns entries must be valid regex fragments' },
      ),
    )
    .optional(),
})

export const aiNotesConfigSchema = z.object({
  root: z.string(),
  include: z.array(z.string()).min(1, 'include must contain at least one glob pattern'),
  exclude: z.array(z.string()),
  output: z.string().min(1, 'output directory must not be empty'),
  tsconfigPath: z.string().optional(),
  llm: llmConfigSchema.optional(),
  maxSourceLines: z
    .number()
    .int('maxSourceLines must be an integer')
    .positive('maxSourceLines must be > 0')
    .optional(),
  staleThresholdDays: z
    .number()
    .int('staleThresholdDays must be an integer')
    .positive('staleThresholdDays must be > 0')
    .optional(),
  language: z.string().min(2, 'language must be a valid BCP 47 tag (e.g. "en", "pt-BR")').optional(),
  analysis: analysisConfigSchema.optional(),
})

export type ValidatedConfig = z.infer<typeof aiNotesConfigSchema>
