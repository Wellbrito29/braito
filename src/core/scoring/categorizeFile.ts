/**
 * Synthesis-budget categories. Drives both LLM-priority boost and skip
 * decisions for diff-aware budget allocation. The category is derived from
 * path patterns alone — no file content read — so callers can categorize
 * thousands of files without I/O.
 *
 * Skip categories always force `synthesized=false` regardless of any
 * criticality boost: tests, configs, type-only declarations, generated
 * artefacts. Synthesizing them wastes LLM tokens because the file is either
 * trivially documented by its name (tests, configs) or self-documented by
 * its types.
 *
 * Source categories receive a positive type-boost applied on top of the
 * diff-edit boost. The hierarchy reflects review value: API contracts >
 * library exports > React hooks > components > generic source.
 */
export type FileCategory =
  | 'skip:test'
  | 'skip:config'
  | 'skip:type-only'
  | 'skip:generated'
  | 'api-route'
  | 'lib'
  | 'hook'
  | 'component'
  | 'default-source'
  | 'aux'
  | 'unknown'

export type CategorizeResult = {
  category: FileCategory
  isSkip: boolean
  isSource: boolean
}

const TEST_PATTERN = /(\.|\/)(test|spec)\.[mc]?[jt]sx?$|\/__tests__\/|\/tests?\//
const CONFIG_PATTERN =
  /(^|\/)(package(-lock)?\.json|tsconfig.*\.json|\.eslintrc.*|\.prettierrc.*|babel\.config\.[mc]?[jt]s|vite\.config\.[mc]?[jt]s|webpack\.config\.[mc]?[jt]s|next\.config\.[mc]?[jt]s|jest\.config\.[mc]?[jt]s|vitest\.config\.[mc]?[jt]s|rollup\.config\.[mc]?[jt]s|tailwind\.config\.[mc]?[jt]s|postcss\.config\.[mc]?[jt]s|\.editorconfig|\.gitignore|\.gitattributes|Makefile|Dockerfile|\.dockerignore)$/i
const TYPE_ONLY_PATTERN = /\.d\.ts$|(^|\/)types?\.[mc]?ts$/
const GENERATED_PATTERN =
  /(^|\/)(dist|build|\.next|\.nuxt|node_modules|coverage|\.cache|out|target|generated)\//

const API_ROUTE_PATTERN =
  /\/api\/.+\/(route|handler)\.[mc]?[jt]sx?$|\/(handlers|controllers)\/.+\.[mc]?[jt]sx?$/
const LIB_PATTERN = /(^|\/)(lib|packages\/[^/]+\/src)\//
const HOOK_PATTERN = /(^|\/)(hooks?\/)?use[A-Z][^/]*\.[mc]?ts$/
const COMPONENT_PATTERN = /\.(tsx|jsx)$/
const SOURCE_PATTERN = /\.(?:[mc]?[jt]sx?)$/

export function categorizeFile(relativePath: string): CategorizeResult {
  const p = relativePath.replace(/\\/g, '/')

  // Skip patterns checked first — they win even if the file also looks like
  // a "lib" or "component". A test inside lib/ is still a test.
  if (GENERATED_PATTERN.test(p)) return { category: 'skip:generated', isSkip: true, isSource: false }
  if (TEST_PATTERN.test(p)) return { category: 'skip:test', isSkip: true, isSource: false }
  if (CONFIG_PATTERN.test(p)) return { category: 'skip:config', isSkip: true, isSource: false }
  if (TYPE_ONLY_PATTERN.test(p)) return { category: 'skip:type-only', isSkip: true, isSource: false }

  // Source categories — most specific first.
  if (API_ROUTE_PATTERN.test(p)) return { category: 'api-route', isSkip: false, isSource: true }
  if (HOOK_PATTERN.test(p)) return { category: 'hook', isSkip: false, isSource: true }
  if (LIB_PATTERN.test(p)) return { category: 'lib', isSkip: false, isSource: true }
  if (COMPONENT_PATTERN.test(p)) return { category: 'component', isSkip: false, isSource: true }
  if (SOURCE_PATTERN.test(p)) return { category: 'default-source', isSkip: false, isSource: true }

  // Markdown, plaintext, scripts that aren't JS/TS — auxiliary, not source.
  return { category: 'aux', isSkip: false, isSource: false }
}

/** Type-boost added on top of diff-edit boost. Skips return -∞. */
export function typeBoost(category: FileCategory): number {
  switch (category) {
    case 'api-route':
      return 0.2
    case 'lib':
      return 0.1
    case 'hook':
      return 0.1
    case 'component':
      return 0.05
    case 'default-source':
      return 0
    case 'aux':
      return 0
    case 'unknown':
      return 0
    case 'skip:test':
    case 'skip:config':
    case 'skip:type-only':
    case 'skip:generated':
      return Number.NEGATIVE_INFINITY
  }
}
