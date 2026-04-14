import { z } from 'zod'

const evidenceItemSchema = z.object({
  type: z.enum(['code', 'git', 'test', 'graph', 'comment', 'doc']).catch('code'),
  detail: z.string(),
})

const structuredListFieldSchema = z.object({
  observed: z.array(z.string()).default([]),
  inferred: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceItemSchema).default([]),
})

export const llmNoteSchema = z.object({
  schemaVersion: z.string().optional(),
  purpose: structuredListFieldSchema,
  invariants: structuredListFieldSchema,
  sensitiveDependencies: structuredListFieldSchema,
  importantDecisions: structuredListFieldSchema,
  knownPitfalls: structuredListFieldSchema,
  impactValidation: structuredListFieldSchema,
})

export type LLMNotePayload = z.infer<typeof llmNoteSchema>
