import { categorizeFile } from './categorizeFile.ts'
import type { DiffFiles } from '../git/getDiffFiles.ts'

export const DEFAULT_NEW_SOURCE_QUOTA = 8

export type QuotaCandidate = {
  relativePath: string
  baseScore: number
}

/**
 * Picks up to N newly-added source files that should be force-synthesized
 * regardless of their criticality score. Files are returned sorted by
 * baseScore desc — when budget is tight and not every new source can be
 * covered, the higher-score ones win.
 *
 * "Source" excludes skip categories (test/config/type-only/generated), so a
 * PR that adds 50 test files won't burn the quota on tests.
 *
 * The quota only fires when the diff carries newly-added files. For a
 * full re-run with no diff, callers should pass `diff=null` and this
 * function returns an empty list (no behaviour change vs. legacy runs).
 */
export function pickQuotaForcedFiles(
  candidates: QuotaCandidate[],
  diff: DiffFiles | null,
  quota: number = DEFAULT_NEW_SOURCE_QUOTA,
): Set<string> {
  if (!diff || quota <= 0 || candidates.length === 0) return new Set()

  const eligible = candidates
    .filter((c) => diff.added.has(c.relativePath))
    .filter((c) => {
      const cat = categorizeFile(c.relativePath)
      return !cat.isSkip && cat.isSource
    })
    .sort((a, b) => b.baseScore - a.baseScore)

  const cap = Math.min(quota, eligible.length)
  return new Set(eligible.slice(0, cap).map((c) => c.relativePath))
}
