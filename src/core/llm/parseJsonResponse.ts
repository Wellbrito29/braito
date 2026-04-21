// Tolerant parser for LLM JSON responses.
//
// Some providers (notably claude-cli) prepend prose like "Looking at this file..."
// or wrap output in markdown fences before/after the JSON object. We try the
// strict parse first, then fall back to fence-stripping, then to extracting the
// outermost balanced {...} block. Throws if no valid JSON can be recovered.

export function parseJsonResponse(raw: string): unknown {
  const trimmed = raw.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    // fall through
  }

  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  if (stripped !== trimmed) {
    try {
      return JSON.parse(stripped)
    } catch {
      // fall through
    }
  }

  // Try every '{' position as a candidate start. A prose preamble may contain
  // its own braces (e.g. "Preamble {ignored} text") which would confuse a
  // single-pass extractor, so we try each balanced {…} block until one parses.
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] !== '{') continue
    const block = extractBalancedJsonObject(trimmed, i)
    if (block === null) continue
    try {
      return JSON.parse(block)
    } catch {
      // try next '{'
    }
  }

  throw new SyntaxError(
    `Could not extract JSON object from LLM response (first 200 chars: ${trimmed.slice(0, 200)})`,
  )
}

// Walk from `start` (which must point to a '{') with a brace counter that
// respects string literals and escapes; return the balanced { ... } substring
// or null if no matching closer is found before end-of-input.
function extractBalancedJsonObject(s: string, start: number): string | null {
  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < s.length; i++) {
    const ch = s[i]

    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\') {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }

  return null
}
