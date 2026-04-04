import path from 'node:path'
import fs from 'node:fs'

const CONTEXT_FILENAME = 'braito.context.md'
const MAX_CHARS = 4000

/**
 * Reads the optional braito.context.md file from the project root.
 * Returns the trimmed content, or null if the file does not exist.
 * Content is capped at MAX_CHARS to avoid bloating the LLM prompt.
 */
export function loadProjectContext(root: string): string | null {
  const contextPath = path.resolve(root, CONTEXT_FILENAME)
  if (!fs.existsSync(contextPath)) return null

  try {
    const raw = fs.readFileSync(contextPath, 'utf-8').trim()
    if (!raw) return null
    return raw.length > MAX_CHARS ? raw.slice(0, MAX_CHARS) + '\n...(truncated)' : raw
  } catch {
    return null
  }
}
