import path from 'node:path'
import fs from 'node:fs'

export type PathAliases = Record<string, string[]>

const BUNDLER_CONFIGS = [
  'vite.config.ts',
  'vite.config.js',
  'vite.config.mts',
  'vite.config.mjs',
  'webpack.config.ts',
  'webpack.config.js',
  'metro.config.ts',
  'metro.config.js',
]

/**
 * Loads path aliases from tsconfig.json and bundler config files (Vite, Webpack, Metro).
 * Handles the most common alias patterns — object form and Vite array form.
 */
export function loadBundlerAliases(root: string): PathAliases {
  const aliases: PathAliases = {}

  // tsconfig.json paths always take precedence
  Object.assign(aliases, loadTsconfigPaths(root))

  // First matching bundler config wins
  for (const configFile of BUNDLER_CONFIGS) {
    const filePath = path.join(root, configFile)
    if (!fs.existsSync(filePath)) continue
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      Object.assign(aliases, extractBundlerAliases(content))
      break
    } catch {
      // skip unreadable or unparseable configs
    }
  }

  return aliases
}

function loadTsconfigPaths(root: string): PathAliases {
  const tsconfigPath = path.join(root, 'tsconfig.json')
  if (!fs.existsSync(tsconfigPath)) return {}

  try {
    const raw = fs.readFileSync(tsconfigPath, 'utf-8')
    // Strip JSONC comments before parsing
    const stripped = raw
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
    const parsed = JSON.parse(stripped)
    return (parsed?.compilerOptions?.paths as PathAliases) ?? {}
  } catch {
    return {}
  }
}

function extractBundlerAliases(content: string): PathAliases {
  const aliases: PathAliases = {}

  // Object form: alias: { '@': '/src', ... }
  const objectBlock = findBlock(content, /\balias\s*:/, '{', '}')
  if (objectBlock) Object.assign(aliases, parseObjectAliases(objectBlock))

  // Vite array form: alias: [ { find: '@', replacement: '/src' }, ... ]
  const arrayBlock = findBlock(content, /\balias\s*:/, '[', ']')
  if (arrayBlock) Object.assign(aliases, parseArrayAliases(arrayBlock))

  // Metro: extraNodeModules: { ... }
  const extraModulesBlock = findBlock(content, /\bextraNodeModules\s*:/, '{', '}')
  if (extraModulesBlock) Object.assign(aliases, parseObjectAliases(extraModulesBlock))

  return aliases
}

/** Finds the content of the next balanced block (braces or brackets) after a pattern match. */
function findBlock(
  content: string,
  pattern: RegExp,
  open: string,
  close: string,
): string | null {
  const match = pattern.exec(content)
  if (!match) return null

  const start = content.indexOf(open, match.index + match[0].length)
  if (start === -1) return null

  let depth = 0
  for (let i = start; i < content.length; i++) {
    if (content[i] === open) depth++
    else if (content[i] === close) {
      depth--
      if (depth === 0) return content.slice(start, i + 1)
    }
  }
  return null
}

/** Resolves a value expression to a relative path string. */
function normalizeValue(raw: string): string | null {
  const trimmed = raw.trim()

  // path.resolve(__dirname, 'src') or path.resolve(root, './src')
  const resolveMatch = trimmed.match(/path\.resolve\s*\([^,)]+,\s*['"]([^'"]+)['"]\s*\)/)
  if (resolveMatch) return resolveMatch[1].replace(/^[./]+/, '')

  // fileURLToPath(new URL('./src', import.meta.url))
  const urlMatch = trimmed.match(/new URL\s*\(\s*['"]([^'"]+)['"]/)
  if (urlMatch) return urlMatch[1].replace(/^\.\//, '')

  // Plain string: '/src' or 'src'
  const strMatch = trimmed.match(/^['"]([^'"]+)['"]$/)
  if (strMatch) return strMatch[1].replace(/^\//, '')

  return null
}

function toAliasKey(key: string): string {
  return key.endsWith('/*') ? key : `${key}/*`
}

function toAliasValue(value: string): string {
  return value.endsWith('/*') ? value : `${value}/*`
}

/** Parses: { '@': '/src', '~': path.resolve(..., 'src') } */
function parseObjectAliases(block: string): PathAliases {
  const aliases: PathAliases = {}
  // Match quoted key followed by colon and a value up to the next comma or closing brace
  const re = /['"]([^'"]+)['"]\s*:\s*([^,}\n]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block)) !== null) {
    const key = m[1]
    const value = normalizeValue(m[2])
    if (!key || !value) continue
    aliases[toAliasKey(key)] = [toAliasValue(value)]
  }
  return aliases
}

/** Parses Vite array form: [ { find: '@', replacement: '/src' }, ... ] */
function parseArrayAliases(block: string): PathAliases {
  const aliases: PathAliases = {}
  // Match { find: 'key', replacement: value } in any order
  const entryRe = /\{[^}]*find\s*:\s*['"]([^'"]+)['"]\s*,[^}]*replacement\s*:\s*([^,}]+)[^}]*\}/g
  let m: RegExpExecArray | null
  while ((m = entryRe.exec(block)) !== null) {
    const key = m[1]
    const value = normalizeValue(m[2])
    if (!key || !value) continue
    aliases[toAliasKey(key)] = [toAliasValue(value)]
  }
  return aliases
}
