import type { SourceFile } from 'ts-morph'

export type ExtractedComments = {
  todo: string[]
  fixme: string[]
  hack: string[]
}

export function extractComments(sourceFile: SourceFile): ExtractedComments {
  const todo: string[] = []
  const fixme: string[] = []
  const hack: string[] = []

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
    }
  }

  return { todo, fixme, hack }
}
