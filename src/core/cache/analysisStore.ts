import path from 'node:path'
import fs from 'node:fs/promises'
import type { StaticFileAnalysis } from '../types/file-analysis.ts'

const ANALYSIS_FILE = 'analyses.json'

export type AnalysisStore = Map<string, StaticFileAnalysis>

export async function loadAnalysisStore(root: string): Promise<AnalysisStore> {
  const storePath = getStorePath(root)
  try {
    const raw = await fs.readFile(storePath, 'utf-8')
    const obj = JSON.parse(raw) as Record<string, StaticFileAnalysis>
    return new Map(Object.entries(obj))
  } catch {
    return new Map()
  }
}

export async function saveAnalysisStore(root: string, store: AnalysisStore): Promise<void> {
  const storePath = getStorePath(root)
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, JSON.stringify(Object.fromEntries(store), null, 2), 'utf-8')
}

function getStorePath(root: string): string {
  return path.resolve(root, 'cache', ANALYSIS_FILE)
}
