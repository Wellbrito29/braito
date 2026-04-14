/**
 * Extracts `process.env.<VAR>` references from source text.
 * Returns a deduped list of the variable names (upper-snake_case, leading letter).
 */
export function extractEnvVars(text: string): string[] {
  const matches = text.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)
  return [...new Set([...matches].map((m) => m[1]))]
}
