import path from 'node:path'
import fs from 'node:fs/promises'

/**
 * Per-file snapshot of the hashes of that file's direct dependencies at the
 * moment its note was generated. Keys are relative paths, values are SHA-1
 * content hashes (same format as cache/hashes.json). Used to detect transitive
 * staleness: a note is stale when one of its deps' current hash differs from
 * the hash captured here.
 */
export type DepFingerprint = Record<string, string>

/** relativePath (of the file owning the note) → its dep fingerprint. */
export type FingerprintStore = Map<string, DepFingerprint>

const FINGERPRINT_PATH = 'cache/dep-fingerprints.json'

export async function loadFingerprints(root: string): Promise<FingerprintStore> {
  const filePath = path.resolve(root, FINGERPRINT_PATH)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const obj = JSON.parse(raw) as Record<string, DepFingerprint>
    return new Map(Object.entries(obj))
  } catch {
    return new Map()
  }
}

export async function saveFingerprints(root: string, store: FingerprintStore): Promise<void> {
  const filePath = path.resolve(root, FINGERPRINT_PATH)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const obj: Record<string, DepFingerprint> = {}
  // Sort keys for deterministic output
  for (const k of [...store.keys()].sort()) obj[k] = store.get(k)!
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2))
}

/**
 * A file's note is transitively stale when any of its direct deps changed
 * since the note was last written. Returns true when the dep set differs
 * in size, a dep vanished, a new dep appeared, or any dep's hash changed.
 *
 * A missing stored fingerprint returns false — the caller should decide
 * whether first-time files should be re-synthesized. This conservative
 * default prevents a forced mass-resync the first time the feature ships.
 */
export function areDepsStale(
  currentDepHashes: Record<string, string>,
  storedFingerprint: DepFingerprint | undefined,
): boolean {
  if (!storedFingerprint) return false
  const currentKeys = Object.keys(currentDepHashes)
  const storedKeys = Object.keys(storedFingerprint)
  if (currentKeys.length !== storedKeys.length) return true
  for (const k of currentKeys) {
    if (storedFingerprint[k] !== currentDepHashes[k]) return true
  }
  return false
}

/**
 * Build the current dep fingerprint for a file from its direct-dependencies
 * list and the full {relPath → current hash} map. Deps that aren't in the
 * hash map (e.g., external imports that live outside the scanned set) are
 * skipped — they don't participate in the in-repo staleness calculation.
 */
export function buildFingerprint(
  directDepsRel: string[],
  allHashes: Map<string, string>,
): DepFingerprint {
  const fp: DepFingerprint = {}
  for (const dep of directDepsRel) {
    const h = allHashes.get(dep)
    if (h) fp[dep] = h
  }
  return fp
}
