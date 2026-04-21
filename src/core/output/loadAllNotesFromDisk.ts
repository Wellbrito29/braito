import path from 'node:path'
import fs from 'node:fs/promises'
import type { AiFileNote } from '../types/ai-note.ts'

// Filenames the pipeline writes alongside per-file notes — never load these as notes.
const RESERVED = new Set(['index.json', 'graph.json', 'search-index.json', 'divergences.json'])

// Read every per-file AiFileNote JSON under <root>/<outputDir>. The aggregators
// (buildIndex, buildSearchIndex, writeGraph metadata) all derive from this set,
// so they always reflect what is actually persisted on disk — independent of
// which subset of files the current `generate` invocation processed.
//
// Corrupted or missing files are skipped and reported via `errors[]` rather
// than aborting the run; the caller decides whether to log them.
export async function loadAllNotesFromDisk(
  root: string,
  outputDir: string,
): Promise<{ notes: AiFileNote[]; errors: Array<{ path: string; message: string }> }> {
  const notesDir = path.resolve(root, outputDir)
  const notes: AiFileNote[] = []
  const errors: Array<{ path: string; message: string }> = []

  let files: string[]
  try {
    files = await collectJsonFiles(notesDir)
  } catch {
    return { notes, errors }
  }

  await Promise.all(
    files.map(async (file) => {
      if (RESERVED.has(path.basename(file))) return
      try {
        const raw = await fs.readFile(file, 'utf-8')
        notes.push(JSON.parse(raw) as AiFileNote)
      } catch (err) {
        errors.push({ path: file, message: (err as Error).message })
      }
    }),
  )

  return { notes, errors }
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await collectJsonFiles(full)))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(full)
    }
  }
  return out
}
