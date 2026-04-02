import { z } from 'zod'
import type { LLMProvider } from './provider/types.ts'
import type { RepoOverview } from '../types/overview.ts'
import { buildOverviewPrompt } from './prompts/buildOverviewPrompt.ts'
import { logger } from '../utils/logger.ts'

const overviewResponseSchema = z.object({
  description: z.string().min(1),
})

const OVERVIEW_SYSTEM_PROMPT = `You are a software architect generating a high-level overview of a repository.
Be specific and technical. Use domain names and file roles from the data provided.
Return valid JSON only.`

export async function synthesizeOverview(
  overview: RepoOverview,
  provider: LLMProvider,
  temperature: number = 0.3,
  timeoutMs: number = 60_000,
): Promise<RepoOverview> {
  try {
    const prompt = buildOverviewPrompt(overview)

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Overview synthesis timed out after ${timeoutMs}ms`)), timeoutMs),
    )

    const response = await Promise.race([
      provider.complete({ system: OVERVIEW_SYSTEM_PROMPT, user: prompt, temperature }),
      timeoutPromise,
    ])

    const raw = response.content
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()

    const parsed = JSON.parse(raw)
    const validated = overviewResponseSchema.safeParse(parsed)

    if (!validated.success) {
      logger.warn(`Overview LLM response failed validation: ${validated.error.message}`)
      return overview
    }

    return {
      ...overview,
      description: validated.data.description,
      model: response.model,
    }
  } catch (err) {
    logger.warn(`Overview synthesis failed: ${(err as Error).message}`)
    return overview
  }
}
