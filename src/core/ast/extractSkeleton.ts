import fs from 'node:fs'

/**
 * Extracts the semantic skeleton of a TypeScript/JavaScript source file:
 * exported signatures + JSDoc, type definitions, and special inline comments.
 *
 * Used to give the LLM the most informative content within a fixed token budget,
 * rather than naively slicing the first N lines (which are often just imports).
 */

const MAX_LINES = 200
const SPECIAL_COMMENT = /\/\/\s*(DECISION:|INVARIANT:|WHY:|HACK:|TODO:|FIXME:)/i

export function extractSkeleton(filePath: string): string {
  let source: string
  try {
    source = fs.readFileSync(filePath, 'utf-8')
  } catch {
    return '// source not available'
  }

  const lines = source.split('\n')

  // Fast path: small file, return as-is
  if (lines.length <= MAX_LINES) return source

  const skeleton: string[] = []

  // Pass 1: collect import block (up to first non-import line), capped at 20 lines
  let importEnd = 0
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('import ') || trimmed === '' || trimmed.startsWith('//')) {
      importEnd = i
    } else {
      break
    }
  }
  skeleton.push(...lines.slice(0, Math.min(importEnd + 1, 20)))

  // Pass 2: scan for exported declarations + JSDoc above them + special comments
  const added = new Set<number>()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Special inline comments (DECISION, INVARIANT, WHY, HACK, TODO, FIXME)
    if (SPECIAL_COMMENT.test(trimmed)) {
      skeleton.push(line)
      added.add(i)
      continue
    }

    // Exported declarations
    if (
      trimmed.startsWith('export ') ||
      trimmed.startsWith('export default ') ||
      trimmed.startsWith('export async ') ||
      trimmed.startsWith('export type ') ||
      trimmed.startsWith('export interface ') ||
      trimmed.startsWith('export enum ') ||
      trimmed.startsWith('export class ') ||
      trimmed.startsWith('export const ') ||
      trimmed.startsWith('export function ')
    ) {
      // Include JSDoc block immediately above (look back up to 8 lines)
      let jsDocStart = i - 1
      while (jsDocStart >= 0 && (lines[jsDocStart].trim().startsWith('*') || lines[jsDocStart].trim().startsWith('/**') || lines[jsDocStart].trim().startsWith('*/'))) {
        jsDocStart--
      }
      // jsDocStart is now one line before the /** line
      const docBlockStart = jsDocStart + 1
      if (docBlockStart < i) {
        for (let j = docBlockStart; j < i; j++) {
          if (!added.has(j)) {
            skeleton.push(lines[j])
            added.add(j)
          }
        }
      }

      // The declaration line itself
      if (!added.has(i)) {
        skeleton.push(line)
        added.add(i)
      }

      // For functions/classes: include opening brace + first body line as a hint
      if (trimmed.endsWith('{') || trimmed.endsWith('=> {')) {
        if (i + 1 < lines.length && !added.has(i + 1)) {
          skeleton.push(lines[i + 1])
          added.add(i + 1)
        }
        skeleton.push('  // ...')
        skeleton.push('}')
      } else if (!trimmed.includes('{')) {
        // Multi-line signature — include until we hit the opening brace
        let j = i + 1
        while (j < lines.length && j < i + 6) {
          if (!added.has(j)) {
            skeleton.push(lines[j])
            added.add(j)
          }
          if (lines[j].includes('{')) break
          j++
        }
        if (j < lines.length && lines[j].includes('{') && j < i + 6) {
          skeleton.push('  // ...')
          skeleton.push('}')
        }
      }
    }
  }

  const result = skeleton.join('\n')

  // If skeleton is still very short (very few exports), fall back to first MAX_LINES lines
  if (result.split('\n').length < 10) {
    return lines.slice(0, MAX_LINES).join('\n') + `\n// ... (truncated at ${MAX_LINES} lines)`
  }

  return result
}
