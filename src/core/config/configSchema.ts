import { z } from 'zod'

export const llmConfigSchema = z.object({
  provider: z.enum(['ollama', 'anthropic', 'openai'], {
    errorMap: () => ({ message: "llm.provider must be 'ollama', 'anthropic', or 'openai'" }),
  }),
  model: z.string().optional(),
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

export const aiNotesConfigSchema = z.object({
  root: z.string(),
  include: z.array(z.string()).min(1, 'include must contain at least one glob pattern'),
  exclude: z.array(z.string()),
  output: z.string().min(1, 'output directory must not be empty'),
  tsconfigPath: z.string().optional(),
  llm: llmConfigSchema.optional(),
  staleThresholdDays: z
    .number()
    .int('staleThresholdDays must be an integer')
    .positive('staleThresholdDays must be > 0')
    .optional(),
  maxSourceLines: z
    .number()
    .int('maxSourceLines must be an integer')
    .positive('maxSourceLines must be > 0')
    .optional(),
})

export type ValidatedConfig = z.infer<typeof aiNotesConfigSchema>
