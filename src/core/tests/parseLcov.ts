/**
 * Parses an lcov.info file and returns per-file line coverage as a 0–1 ratio.
 * Only files with at least one tracked line are included.
 */
export function parseLcov(content: string): Map<string, number> {
  const coverage = new Map<string, number>()
  let currentFile: string | null = null
  let linesFound = 0
  let linesHit = 0

  for (const raw of content.split('\n')) {
    const line = raw.trim()

    if (line.startsWith('SF:')) {
      currentFile = line.slice(3).trim()
      linesFound = 0
      linesHit = 0
    } else if (line.startsWith('LF:')) {
      linesFound = parseInt(line.slice(3), 10)
    } else if (line.startsWith('LH:')) {
      linesHit = parseInt(line.slice(3), 10)
    } else if (line === 'end_of_record' && currentFile !== null) {
      if (linesFound > 0) {
        coverage.set(currentFile, linesHit / linesFound)
      }
      currentFile = null
    }
  }

  return coverage
}
