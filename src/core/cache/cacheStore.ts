import path from 'node:path'
import fs from 'node:fs/promises'

const CACHE_FILE = 'hashes.json'

export type HashStore = Map<string, string>

export async function loadCache(root: string): Promise<HashStore> {
  const cachePath = getCachePath(root)
  try {
    const raw = await fs.readFile(cachePath, 'utf-8')
    const obj = JSON.parse(raw) as Record<string, string>
    return new Map(Object.entries(obj))
  } catch {
    return new Map()
  }
}

export async function saveCache(root: string, store: HashStore): Promise<void> {
  const cachePath = getCachePath(root)
  await fs.mkdir(path.dirname(cachePath), { recursive: true })
  const obj = Object.fromEntries(store)
  await fs.writeFile(cachePath, JSON.stringify(obj, null, 2), 'utf-8')
}

function getCachePath(root: string): string {
  return path.resolve(root, 'cache', CACHE_FILE)
}
