import path from 'node:path'
import fs from 'node:fs/promises'
import type { AiFileNote } from '../types/ai-note.ts'

export async function writeJsonNote(
  note: AiFileNote,
  root: string,
  outputDir: string,
): Promise<string> {
  const relativePath = path.relative(root, note.filePath)
  const resolvedOutputDir = path.resolve(root, outputDir)
  const outputPath = path.resolve(resolvedOutputDir, relativePath + '.json')

  if (!path.normalize(outputPath).startsWith(path.normalize(resolvedOutputDir) + path.sep)) {
    throw new Error(`Security: output path escapes notes directory: ${note.filePath}`)
  }

  const outputFolder = path.dirname(outputPath)
  await fs.mkdir(outputFolder, { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(note, null, 2), 'utf-8')

  return outputPath
}
