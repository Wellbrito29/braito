import path from 'node:path'
import fs from 'node:fs'
import { parseLcov } from './parseLcov.ts'

/**
 * Tries to load a coverage report from the project root.
 * Checks (in order): coverage/lcov.info, coverage/coverage-summary.json
 * Returns a Map of relativePath → coverage ratio (0–1), or null if no report found.
 */
export function loadCoverage(root: string): Map<string, number> | null {
  const lcovPath = path.join(root, 'coverage', 'lcov.info')
  if (fs.existsSync(lcovPath)) {
    try {
      const content = fs.readFileSync(lcovPath, 'utf-8')
      const raw = parseLcov(content)
      return normalizePaths(raw, root)
    } catch {
      return null
    }
  }

  const summaryPath = path.join(root, 'coverage', 'coverage-summary.json')
  if (fs.existsSync(summaryPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(summaryPath, 'utf-8')) as Record<
        string,
        { lines: { pct: number } }
      >
      const coverage = new Map<string, number>()
      for (const [filePath, data] of Object.entries(raw)) {
        if (filePath === 'total') continue
        const rel = path.relative(root, filePath)
        coverage.set(rel, (data.lines?.pct ?? 0) / 100)
      }
      return coverage
    } catch {
      return null
    }
  }

  return null
}

/** Normalizes absolute paths from lcov to relative paths from root. */
function normalizePaths(raw: Map<string, number>, root: string): Map<string, number> {
  const normalized = new Map<string, number>()
  for (const [filePath, pct] of raw) {
    const rel = path.isAbsolute(filePath) ? path.relative(root, filePath) : filePath
    normalized.set(rel, pct)
  }
  return normalized
}
