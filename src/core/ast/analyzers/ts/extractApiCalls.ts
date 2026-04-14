/**
 * Extracts literal URLs passed to HTTP client calls (`fetch`, `axios`, `got`, `request`).
 * Only string / template-literal specifiers without interpolation are captured.
 */
export function extractApiCalls(text: string): string[] {
  const matches = text.matchAll(/(?:fetch|axios|got|request)\s*\(\s*['"`]([^'"`]+)['"`]/g)
  return [...new Set([...matches].map((m) => m[1]))]
}
