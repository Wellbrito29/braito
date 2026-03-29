import type { SourceFile } from 'ts-morph'

export type ExtractedComments = {
  todo: string[]
  fixme: string[]
  hack: string[]
  invariant: string[]
  decision: string[]
}

const INVARIANT_RE = /\/\/.*\b(INVARIANT|CONTRACT|ASSERT|REQUIRES|ENSURES)\b[:\s]/i
const DECISION_RE = /\/\/.*\b(NOTE|DECISION|WHY|REASON|RATIONALE|ADR)\b[:\s]/i
const BLOCK_INVARIANT_RE = /\/\*.*\b(INVARIANT|CONTRACT|ASSERT|REQUIRES|ENSURES)\b/i
const BLOCK_DECISION_RE = /\/\*.*\b(NOTE|DECISION|WHY|REASON|RATIONALE|ADR)\b/i

export function extractComments(sourceFile: SourceFile): ExtractedComments {
  const todo: string[] = []
  const fixme: string[] = []
  const hack: string[] = []
  const invariant: string[] = []
  const decision: string[] = []

  const text = sourceFile.getFullText()
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (/\/\/.*\bTODO\b/i.test(trimmed) || /\/\*.*\bTODO\b/i.test(trimmed)) {
      todo.push(trimmed.replace(/^\/\/\s*/, '').replace(/^\/\*\s*/, '').trim())
    } else if (/\/\/.*\bFIXME\b/i.test(trimmed) || /\/\*.*\bFIXME\b/i.test(trimmed)) {
      fixme.push(trimmed.replace(/^\/\/\s*/, '').replace(/^\/\*\s*/, '').trim())
    } else if (/\/\/.*\bHACK\b/i.test(trimmed) || /\/\*.*\bHACK\b/i.test(trimmed)) {
      hack.push(trimmed.replace(/^\/\/\s*/, '').replace(/^\/\*\s*/, '').trim())
    } else if (INVARIANT_RE.test(trimmed) || BLOCK_INVARIANT_RE.test(trimmed)) {
      invariant.push(trimmed.replace(/^\/\/\s*/, '').replace(/^\/\*\s*/, '').trim())
    } else if (DECISION_RE.test(trimmed) || BLOCK_DECISION_RE.test(trimmed)) {
      decision.push(trimmed.replace(/^\/\/\s*/, '').replace(/^\/\*\s*/, '').trim())
    }
  }

  return { todo, fixme, hack, invariant, decision }
}
