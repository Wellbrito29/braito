import path from 'node:path'
import fs from 'node:fs'

type PathAliases = Record<string, string[]>

export function resolveImportPath(
  importSpecifier: string,
  fromFile: string,
  root: string,
  aliases: PathAliases = {},
): string | null {
  // Resolve relative imports
  if (importSpecifier.startsWith('.')) {
    const dir = path.dirname(fromFile)
    const resolved = path.resolve(dir, importSpecifier)
    return resolveWithExtensions(resolved)
  }

  // Resolve alias imports (e.g. @/, ~/, or tsconfig paths)
  for (const [alias, targets] of Object.entries(aliases)) {
    const cleanAlias = alias.replace(/\/\*$/, '')
    if (importSpecifier.startsWith(cleanAlias + '/') || importSpecifier === cleanAlias) {
      const rest = importSpecifier.slice(cleanAlias.length).replace(/^\//, '')
      for (const target of targets) {
        const cleanTarget = target.replace(/\/\*$/, '')
        const candidate = path.resolve(root, cleanTarget, rest)
        const resolved = resolveWithExtensions(candidate)
        if (resolved) return resolved
      }
    }
  }

  return null
}

function resolveWithExtensions(base: string): string | null {
  const extensions = ['.ts', '.tsx', '.js', '.jsx']

  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base

  for (const ext of extensions) {
    const candidate = base + ext
    if (fs.existsSync(candidate)) return candidate
  }

  // Try index file
  for (const ext of extensions) {
    const candidate = path.join(base, `index${ext}`)
    if (fs.existsSync(candidate)) return candidate
  }

  return null
}
