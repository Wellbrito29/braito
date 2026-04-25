import path from 'node:path'
import fs from 'node:fs'

type PathAliases = Record<string, string[]>

/**
 * Options bag for resolveImportPath. Kept as an optional final param so
 * existing call sites that only pass aliases continue to work.
 */
export interface ResolveOptions {
  aliases?: PathAliases
  /**
   * Go module path declared in `go.mod` (e.g. "rd-autonomous-team").
   * When set, imports prefixed with `<goModulePath>/` are resolved as
   * paths relative to the repo root. Required for module-local Go
   * imports to produce graph edges.
   */
  goModulePath?: string
}

export function resolveImportPath(
  importSpecifier: string,
  fromFile: string,
  root: string,
  optsOrAliases: PathAliases | ResolveOptions = {},
): string | null {
  // Backward-compatible signature: callers may pass aliases directly
  // (legacy) or a full ResolveOptions bag (new). Normalize to opts.
  const opts: ResolveOptions =
    'aliases' in optsOrAliases || 'goModulePath' in optsOrAliases
      ? (optsOrAliases as ResolveOptions)
      : { aliases: optsOrAliases as PathAliases }
  const aliases = opts.aliases ?? {}

  // Resolve relative imports
  if (importSpecifier.startsWith('.')) {
    const dir = path.dirname(fromFile)
    const resolved = path.resolve(dir, importSpecifier)
    return resolveWithExtensions(resolved)
  }

  // Resolve Go module-local imports (e.g. "rd-autonomous-team/internal/contracts")
  // by stripping the module prefix and resolving relative to root.
  if (opts.goModulePath) {
    const prefix = opts.goModulePath + '/'
    if (importSpecifier === opts.goModulePath || importSpecifier.startsWith(prefix)) {
      const rest = importSpecifier === opts.goModulePath
        ? ''
        : importSpecifier.slice(prefix.length)
      const candidate = path.resolve(root, rest)
      const resolved = resolveWithExtensions(candidate)
      if (resolved) return resolved
    }
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

// Extension priority: TS family first (most repos), then Go, then Python.
// The order matters when multiple files with the same basename and
// different extensions coexist — first match wins.
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.go', '.py']

function resolveWithExtensions(base: string): string | null {
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base

  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = base + ext
    if (fs.existsSync(candidate)) return candidate
  }

  // Try directory index — for Go this maps a package import like
  // `rd-autonomous-team/internal/contracts` to any *.go file in that
  // directory (Go imports refer to packages, not individual files).
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    // For Go: pick the first non-test .go file in the package directory.
    // This is approximate (Go packages span multiple files) but produces
    // a valid graph edge that tools like get_impact can act on.
    const goFile = pickGoPackageFile(base)
    if (goFile) return goFile

    // For TS/JS: try index files
    for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
      const candidate = path.join(base, `index${ext}`)
      if (fs.existsSync(candidate)) return candidate
    }
  } else {
    // Try TS index file even if the bare base doesn't exist as a dir
    // (covers `import './foo'` where ./foo/ exists but resolution
    // started from a different working dir). Keep the original logic.
    for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
      const candidate = path.join(base, `index${ext}`)
      if (fs.existsSync(candidate)) return candidate
    }
  }

  return null
}

/**
 * Returns the path to the first non-test .go file in a directory, or null.
 * Used to map Go package imports (which target a directory) to a single
 * file representative for graph edges.
 */
function pickGoPackageFile(dir: string): string | null {
  let entries: string[]
  try {
    entries = fs.readdirSync(dir)
  } catch {
    return null
  }
  // Prefer non-test files; fall back to anything if only tests exist.
  const goFiles = entries.filter((f) => f.endsWith('.go'))
  const nonTest = goFiles.filter((f) => !f.endsWith('_test.go'))
  const pick = nonTest[0] ?? goFiles[0]
  return pick ? path.join(dir, pick) : null
}
