import path from 'node:path'

export type DiffFiles = {
  added: Set<string>
  modified: Set<string>
  deleted: Set<string>
}

const empty = (): DiffFiles => ({
  added: new Set(),
  modified: new Set(),
  deleted: new Set(),
})

/**
 * Returns the set of files that changed between `base` and HEAD, classified
 * as added | modified | deleted. Paths are POSIX-relative to `root` so callers
 * can match them against `relativePath` from the scanner output without
 * platform-specific separator concerns.
 *
 * Returns empty sets when:
 *   - `root` is not a git repo
 *   - `base` ref does not exist in the local repo
 *   - any git invocation fails
 *
 * Why three-dot diff (`base...HEAD`): we want the changes introduced by the
 * current branch *since it diverged* from `base`, not changes accumulated on
 * `base` after divergence. Two-dot would show those too.
 */
export function getDiffFiles(base: string, root: string): DiffFiles {
  if (!isGitRepo(root)) return empty()
  if (!refExists(base, root)) return empty()

  const result = Bun.spawnSync(
    ['git', 'diff', '--name-status', `${base}...HEAD`],
    { cwd: root },
  )
  if (result.exitCode !== 0) return empty()

  const out = empty()
  const lines = result.stdout
    .toString()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  for (const line of lines) {
    // Format: "<status>\t<path>" or "R<NN>\t<old>\t<new>" for renames
    const parts = line.split('\t')
    const status = parts[0]?.[0] ?? ''
    if (!status) continue

    // Renames are reported as R<score>; the new path is the last column.
    const target = parts[parts.length - 1]
    if (!target) continue

    const norm = toPosix(target)
    switch (status) {
      case 'A':
        out.added.add(norm)
        break
      case 'M':
      case 'T': // type change (file → symlink, etc.) — treat as modify
        out.modified.add(norm)
        break
      case 'D':
        out.deleted.add(norm)
        break
      case 'R':
        // Renames carry both: old path is gone, new path is added in spirit
        // (its content may diverge from old). Treat the new path as modified
        // so the boost is moderate, not full-newness.
        out.modified.add(norm)
        if (parts.length >= 3 && parts[1]) out.deleted.add(toPosix(parts[1]))
        break
      case 'C':
        // Copy: new file with content lifted from another. Treat as added.
        out.added.add(norm)
        break
    }
  }

  return out
}

function isGitRepo(root: string): boolean {
  try {
    const result = Bun.spawnSync(['git', 'rev-parse', '--git-dir'], { cwd: root })
    return result.exitCode === 0
  } catch {
    return false
  }
}

function refExists(ref: string, root: string): boolean {
  try {
    const result = Bun.spawnSync(
      ['git', 'rev-parse', '--verify', '--quiet', `${ref}^{commit}`],
      { cwd: root },
    )
    return result.exitCode === 0
  } catch {
    return false
  }
}

// Git always emits forward slashes in --name-status output, but normalize
// defensively so callers on Windows can compare against their own paths.
function toPosix(p: string): string {
  return p.split(path.sep).join('/')
}
