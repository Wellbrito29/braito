import path from 'node:path'

export type CoChangedFile = { path: string; count: number }

const TOP_N = 10

export function getCoChangedFiles(filePath: string, root: string): CoChangedFile[] {
  try {
    const relPath = path.relative(root, filePath)

    // Get all commit hashes that touched this file
    const hashResult = Bun.spawnSync(
      ['git', 'log', '--follow', '--format=%H', '--', relPath],
      { cwd: root },
    )

    if (hashResult.exitCode !== 0) return []

    const hashes = hashResult.stdout
      .toString()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (hashes.length === 0) return []

    // For each commit, get the list of files changed
    const frequency = new Map<string, number>()

    for (const hash of hashes) {
      const filesResult = Bun.spawnSync(
        ['git', 'diff-tree', '--no-commit-id', '-r', '--name-only', hash],
        { cwd: root },
      )

      if (filesResult.exitCode !== 0) continue

      const changedFiles = filesResult.stdout
        .toString()
        .split('\n')
        .map((l) => l.trim())
        .filter((f) => f && f !== relPath)

      for (const f of changedFiles) {
        frequency.set(f, (frequency.get(f) ?? 0) + 1)
      }
    }

    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([p, count]) => ({ path: path.resolve(root, p), count }))
  } catch {
    return []
  }
}
