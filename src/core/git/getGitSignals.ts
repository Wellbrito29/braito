import type { GitSignals } from '../types/file-analysis.ts'
import { getFileHistory } from './getFileHistory.ts'
import { getCoChangedFiles } from './getCoChangedFiles.ts'

export function getGitSignals(filePath: string, root: string): GitSignals {
  if (!isGitRepo(root)) {
    return empty(filePath)
  }

  const history = getFileHistory(filePath, root)
  const coChangedFiles = getCoChangedFiles(filePath, root)

  return {
    filePath,
    churnScore: history.churnScore,
    recentCommitMessages: history.recentCommitMessages,
    coChangedFiles,
    authorCount: history.authorCount,
  }
}

function isGitRepo(root: string): boolean {
  try {
    const result = Bun.spawnSync(['git', 'rev-parse', '--git-dir'], { cwd: root })
    return result.exitCode === 0
  } catch {
    return false
  }
}

function empty(filePath: string): GitSignals {
  return {
    filePath,
    churnScore: 0,
    recentCommitMessages: [],
    coChangedFiles: [],
    authorCount: 0,
  }
}
