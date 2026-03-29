import type { HashStore } from './cacheStore.ts'
import { computeHash } from './computeHash.ts'

export async function isCacheValid(
  filePath: string,
  relativePath: string,
  store: HashStore,
): Promise<boolean> {
  const stored = store.get(relativePath)
  if (!stored) return false
  const current = await computeHash(filePath)
  return current === stored
}
