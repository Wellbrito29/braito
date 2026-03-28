export function shouldIgnore(relativePath: string, excludePatterns: string[]): boolean {
  for (const pattern of excludePatterns) {
    if (matchGlob(pattern, relativePath)) return true
  }
  return false
}

function matchGlob(pattern: string, filePath: string): boolean {
  // Convert glob pattern to regex
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLE_STAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLE_STAR__\//g, '(?:.+/)?')
    .replace(/__DOUBLE_STAR__/g, '.*')

  const regex = new RegExp(`^${escaped}$`)
  return regex.test(filePath)
}
