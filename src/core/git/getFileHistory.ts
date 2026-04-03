import path from 'node:path'

export type CommitEntry = {
  hash: string
  date: string    // ISO 8601
  message: string
  author: string
}

export type FileHistory = {
  churnScore: number
  recentCommitMessages: string[]
  recentCommits: CommitEntry[]
  authorCount: number
}

const RECENT_COMMITS_LIMIT = 10

export function getFileHistory(filePath: string, root: string): FileHistory {
  try {
    const relPath = path.relative(root, filePath)

    // %H = full hash, %aI = author date ISO 8601, %s = subject, %an = author name
    const logResult = Bun.spawnSync(
      ['git', 'log', '--follow', '--format=%H|%aI|%s|%an', '--', relPath],
      { cwd: root },
    )

    if (logResult.exitCode !== 0) return empty()

    const lines = logResult.stdout
      .toString()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const recentCommits: CommitEntry[] = lines
      .slice(0, RECENT_COMMITS_LIMIT)
      .map((line) => {
        const [hash, date, ...rest] = line.split('|')
        // author name is the last segment; message may contain pipes
        const author = rest.pop() ?? ''
        const message = rest.join('|')
        return { hash: hash ?? '', date: date ?? '', message, author }
      })

    const recentCommitMessages = recentCommits.map((c) => c.message)

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
      churnScore: lines.length,
      recentCommitMessages,
      recentCommits,
      authorCount,
    }
  } catch {
    return empty()
  }
}

function empty(): FileHistory {
  return { churnScore: 0, recentCommitMessages: [], recentCommits: [], authorCount: 0 }
}
