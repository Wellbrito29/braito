import path from 'node:path'
import type { DiscoveredFile } from '../types/project.ts'

export function findRelatedTests(
  filePath: string,
  allFiles: DiscoveredFile[],
): string[] {
  const base = path.basename(filePath, path.extname(filePath))
  const dir = path.dirname(filePath)
  const related: string[] = []

  const testPatterns = [
    `${base}.spec.ts`,
    `${base}.spec.tsx`,
    `${base}.test.ts`,
    `${base}.test.tsx`,
  ]

  for (const candidate of allFiles) {
    const candidateBase = path.basename(candidate.path)

    // Match by name: same base name with .spec or .test suffix
    if (testPatterns.includes(candidateBase)) {
      related.push(candidate.path)
      continue
    }

    // Match by folder proximity: __tests__ folder in same directory
    if (
      candidate.path.includes('__tests__') &&
      path.dirname(candidate.path).startsWith(dir) &&
      candidateBase.includes(base)
    ) {
      related.push(candidate.path)
    }
  }

  return [...new Set(related)]
}
