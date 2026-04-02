import type { AiFileNote } from '../types/ai-note.ts'
import type { LLMProvider } from './provider/types.ts'
import { buildPrompt, type PromptContext } from './prompts/buildPrompt.ts'
import { SYSTEM_PROMPT } from './prompts/systemPrompt.ts'
import { llmNoteSchema } from './schemas/aiNoteSchema.ts'
import { logger } from '../utils/logger.ts'

export async function synthesizeFileNote(
  ctx: PromptContext,
  provider: LLMProvider,
  temperature: number = 0.2,
  timeoutMs: number = 30_000,
): Promise<AiFileNote> {
  const staticNote = ctx.staticNote

  try {
    const userPrompt = buildPrompt(ctx)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`LLM synthesis timed out after ${timeoutMs}ms`)), timeoutMs)
    )
    const response = await Promise.race([
      provider.complete({
        system: SYSTEM_PROMPT,
        user: userPrompt,
        temperature,
        file: ctx.analysis.filePath,
      }),
      timeoutPromise,
    ])

    const parsed = parseJSON(response.content)
    const validated = llmNoteSchema.safeParse(parsed)

    if (!validated.success) {
      logger.warn(`LLM response failed validation for ${ctx.analysis.filePath}: ${validated.error.message}`)
      return staticNote
    }

    const llm = validated.data

    // Merge: observed comes from static note, inferred + updated confidence from LLM
    return {
      ...staticNote,
      model: response.model,
      summary: llm.summary ?? staticNote.summary,
      purpose: merge(staticNote.purpose, llm.purpose),
      invariants: merge(staticNote.invariants, llm.invariants),
      sensitiveDependencies: merge(staticNote.sensitiveDependencies, llm.sensitiveDependencies),
      importantDecisions: merge(staticNote.importantDecisions, llm.importantDecisions),
      knownPitfalls: merge(staticNote.knownPitfalls, llm.knownPitfalls),
      impactValidation: merge(staticNote.impactValidation, llm.impactValidation),
    }
  } catch (err) {
    logger.warn(`LLM synthesis failed for ${ctx.analysis.filePath}: ${(err as Error).message}`)
    return staticNote
  }
}

function merge(
  staticField: AiFileNote['purpose'],
  llmField: AiFileNote['purpose'],
): AiFileNote['purpose'] {
  return {
    observed: staticField.observed,
    inferred: llmField.inferred,
    confidence: llmField.confidence,
    evidence: [
      ...staticField.evidence,
      ...llmField.evidence.filter((e) => !staticField.evidence.some((s) => s.detail === e.detail)),
    ],
  }
}

function parseJSON(raw: string): unknown {
  // Strip markdown code block if present
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  return JSON.parse(stripped)
}
