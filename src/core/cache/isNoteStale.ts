/**
 * Returns true if a note's generatedAt timestamp is older than thresholdDays.
 */
export function isNoteStale(generatedAt: string, thresholdDays: number): boolean {
  const age = Date.now() - new Date(generatedAt).getTime()
  return age > thresholdDays * 24 * 60 * 60 * 1000
}
