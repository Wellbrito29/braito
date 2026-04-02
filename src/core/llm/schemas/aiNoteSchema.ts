import { z } from 'zod'

const evidenceItemSchema = z.object({
  type: z.enum(['code', 'git', 'test', 'graph', 'comment', 'doc']).catch('code'),
  detail: z.string(),
})

// Coerce array items to strings — the LLM sometimes returns objects like
// { symbol: "Foo", description: "..." } instead of plain strings.
const coercedStringArray = z
  .array(z.unknown())
  .default([])
  .transform((items) =>
    items
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>
          // Try common object shapes the LLM produces
          const text = o.description ?? o.detail ?? o.text ?? o.value ?? o.content
          if (typeof text === 'string') return text
          return JSON.stringify(item)
        }
        return String(item)
      })
      .filter((s) => s.trim().length > 0),
  )

const structuredListFieldSchema = z.object({
  observed: coercedStringArray,
  inferred: coercedStringArray,
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceItemSchema).default([]),
})

export const llmNoteSchema = z.object({
  schemaVersion: z.string().optional(),
  summary: z.string().optional(),
  purpose: structuredListFieldSchema,
  invariants: structuredListFieldSchema,
  sensitiveDependencies: structuredListFieldSchema,
  importantDecisions: structuredListFieldSchema,
  knownPitfalls: structuredListFieldSchema,
  impactValidation: structuredListFieldSchema,
})

export type LLMNotePayload = z.infer<typeof llmNoteSchema>
