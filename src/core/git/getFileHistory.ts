import path from 'node:path'

export type FileHistory = {
  churnScore: number
  recentCommitMessages: string[]
  authorCount: number
}

const RECENT_COMMITS_LIMIT = 10

export function getFileHistory(filePath: string, root: string): FileHistory {
  try {
    const relPath = path.relative(root, filePath)

    const logResult = Bun.spawnSync(
      ['git', 'log', '--follow', `--format=%s`, '--', relPath],
      { cwd: root },
    )

    if (logResult.exitCode !== 0) return empty()

    const messages = logResult.stdout
      .toString()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const shortlogResult = Bun.spawnSync(
      ['git', 'shortlog', '-sn', '--follow', '--', relPath],
      { cwd: root },
    )

    const authorCount = shortlogResult.exitCode === 0
      ? shortlogResult.stdout
          .toString()
          .split('\n')
          .filter(Boolean).length
      : 0

    return {
      churnScore: messages.length,
      recentCommitMessages: messages.slice(0, RECENT_COMMITS_LIMIT),
      authorCount,
    }
  } catch {
    return empty()
  }
}

function empty(): FileHistory {
  return { churnScore: 0, recentCommitMessages: [], authorCount: 0 }
}
