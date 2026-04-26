import { categorizeFile, typeBoost, type FileCategory } from './categorizeFile.ts'
import type { DiffFiles } from '../git/getDiffFiles.ts'

export type EditType = 'added' | 'modified' | 'unchanged'

export type BoostResult = {
  /** Final score after boost (or NEGATIVE_INFINITY when skipped). */
  finalScore: number
  /** Was the file pruned by category (test/config/etc) regardless of edit? */
  skipped: boolean
  /** What category did the file land in? */
  category: FileCategory
  /** Pure boost amount applied (excluding base). */
  boost: number
  /** What edit was detected? */
  edit: EditType
}

const DIFF_BOOST_ADDED_SOURCE = 0.4
const DIFF_BOOST_ADDED_AUX = 0.1
const DIFF_BOOST_MOD_SOURCE = 0.15
const DIFF_BOOST_MOD_AUX = 0.05

/**
 * Returns the final criticality score after applying:
 *   1. Skip categories (force -∞ to suppress synth)
 *   2. Diff-edit boost (added > modified > unchanged)
 *   3. Type-category boost (api-route > lib > hook > component > default)
 *
 * The score is consumed by the synth threshold check downstream:
 *
 *     wouldUseLlm = provider && finalScore >= llmThreshold
 *
 * which means a file with a -∞ skip score never synthesizes regardless of
 * threshold, and a low-criticality but newly-added api-route gets boosted
 * by 0.6 (0.4 add + 0.2 type) which is nearly always enough to clear the
 * 0.4 default threshold.
 */
export function applyDiffBoost(
  relativePath: string,
  baseScore: number,
  diff: DiffFiles | null,
): BoostResult {
  const cat = categorizeFile(relativePath)

  if (cat.isSkip) {
    return {
      finalScore: Number.NEGATIVE_INFINITY,
      skipped: true,
      category: cat.category,
      boost: 0,
      edit: editFor(relativePath, diff),
    }
  }

  const edit = editFor(relativePath, diff)
  const diffBoost = computeDiffBoost(edit, cat.isSource)
  const typeB = typeBoost(cat.category)

  // typeBoost is -Infinity for skip categories already handled above; for
  // non-skip categories it's a small positive (or zero), so plain addition
  // is safe.
  const boost = diffBoost + typeB
  const finalScore = baseScore + boost

  return {
    finalScore,
    skipped: false,
    category: cat.category,
    boost,
    edit,
  }
}

function editFor(relativePath: string, diff: DiffFiles | null): EditType {
  if (!diff) return 'unchanged'
  if (diff.added.has(relativePath)) return 'added'
  if (diff.modified.has(relativePath)) return 'modified'
  return 'unchanged'
}

function computeDiffBoost(edit: EditType, isSource: boolean): number {
  switch (edit) {
    case 'added':
      return isSource ? DIFF_BOOST_ADDED_SOURCE : DIFF_BOOST_ADDED_AUX
    case 'modified':
      return isSource ? DIFF_BOOST_MOD_SOURCE : DIFF_BOOST_MOD_AUX
    case 'unchanged':
      return 0
  }
}
