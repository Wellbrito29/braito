import path from 'node:path'
import type { GovernanceContext } from './types.ts'

/**
 * Divergence detection — cross-reference governance documentation against the
 * actual codebase structure and dependency graph, and surface mismatches as
 * structured findings that can be injected into `knownPitfalls` and persisted
 * to `.ai-notes/divergences.json`.
 *
 * The goal is to close the loop between intent (docs) and reality (code):
 * when the code drifts from what the docs claim, the drift becomes visible.
 */

export type DivergenceType =
  | 'undocumented_hotspot'
  | 'missing_file'
  | 'undeclared_domain'
  | 'forbidden_dependency'

export type DivergenceSeverity = 'info' | 'warn' | 'error'

export type Divergence = {
  type: DivergenceType
  severity: DivergenceSeverity
  message: string
  /** Relative path of the affected source file (when applicable) */
  filePath?: string
  /** Governance document that described the intent (when applicable) */
  docPath?: string
  /** Short quote or reference illustrating the discrepancy */
  evidence?: string
}

export type DivergenceInput = {
  governance: GovernanceContext
  /** Relative paths of all source files present in the repo (from scanner) */
  files: string[]
  /** Dep graph keyed by ABSOLUTE file path — value is absolute paths of imports */
  depGraph: Map<string, string[]>
  /** Reverse graph keyed by ABSOLUTE file path — value is absolute paths of consumers */
  revGraph: Map<string, string[]>
  /** Project root for normalizing absolute paths to relative */
  root: string
}

/** Entry point — returns the full list of divergences (possibly empty). */
export function detectDivergences(input: DivergenceInput): Divergence[] {
  const fileSet = new Set(input.files)
  const out: Divergence[] = []

  out.push(...detectMissingFiles(input, fileSet))
  out.push(...detectUndeclaredDomains(input, fileSet))
  out.push(...detectForbiddenDependencies(input))
  out.push(...detectUndocumentedHotspots(input, fileSet))

  return out
}

/** Group divergences by file for easy per-file injection. */
export function divergencesByFile(divergences: Divergence[]): Map<string, Divergence[]> {
  const map = new Map<string, Divergence[]>()
  for (const d of divergences) {
    if (!d.filePath) continue
    const list = map.get(d.filePath) ?? []
    list.push(d)
    map.set(d.filePath, list)
  }
  return map
}

// ---------------------------------------------------------------------------
// Detector: missing file
// Docs mention `src/foo/bar.ts` but the file doesn't exist in the repo.
// ---------------------------------------------------------------------------
function detectMissingFiles(input: DivergenceInput, fileSet: Set<string>): Divergence[] {
  const out: Divergence[] = []
  const seen = new Set<string>()
  for (const [mentionedPath, info] of input.governance.fileGovernance) {
    if (seen.has(mentionedPath)) continue
    seen.add(mentionedPath)
    if (fileSet.has(mentionedPath)) continue
    // Path may refer to a directory or a path without file extension — skip those heuristically
    if (!/\.[a-zA-Z0-9]{1,5}$/.test(mentionedPath)) continue
    const docPath = info.governingDocs[0]
    out.push({
      type: 'missing_file',
      severity: 'warn',
      message: `Documentation references "${mentionedPath}" but no such file exists in the repo.`,
      docPath,
      evidence: mentionedPath,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Detector: undeclared domain
// Architecture docs list domains like "src/core", "src/cli"; a file under
// "src/legacy" would be flagged as living in an undeclared domain.
// Only runs when the docs actually declare at least one domain mapping.
// ---------------------------------------------------------------------------
function detectUndeclaredDomains(input: DivergenceInput, fileSet: Set<string>): Divergence[] {
  const declaredPatterns = [...new Set(input.governance.model.domainMappings.map((m) => normalizePattern(m.pattern)))]
  if (declaredPatterns.length === 0) return []

  const out: Divergence[] = []
  for (const file of fileSet) {
    // Only consider files under top-level source directories that the docs seem to govern
    const topLevel = file.split('/')[0]
    if (!['src', 'lib', 'internal', 'pkg', 'packages', 'apps', 'modules'].includes(topLevel)) continue
    const covered = declaredPatterns.some((p) => file === p || file.startsWith(p + '/'))
    if (covered) continue
    const doc = input.governance.model.domainMappings[0]?.docPath
    out.push({
      type: 'undeclared_domain',
      severity: 'info',
      message: `File lives outside every domain declared by the architecture docs.`,
      filePath: file,
      docPath: doc,
      evidence: `Declared: ${declaredPatterns.slice(0, 5).join(', ')}${declaredPatterns.length > 5 ? ', …' : ''}`,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Detector: forbidden dependency
// Look for constraint sentences in docs like:
//   "src/domain must not depend on src/infra"
//   "`src/controllers` cannot import from `src/db`"
// and flag any graph edges that violate them.
// ---------------------------------------------------------------------------
const FORBID_PATTERNS: RegExp[] = [
  /`?((?:src|lib|internal|pkg|packages|apps|modules)\/[\w/-]+)`?\s+(?:must|should|cannot|can ?not|may not|must not)(?:\s+not)?\s+(?:depend on|import from|access|use|reach into)\s+`?((?:src|lib|internal|pkg|packages|apps|modules)\/[\w/-]+)`?/gi,
]

function detectForbiddenDependencies(input: DivergenceInput): Divergence[] {
  const rules: Array<{ from: string; to: string; docPath: string; raw: string }> = []
  for (const doc of input.governance.model.docs) {
    for (const pat of FORBID_PATTERNS) {
      for (const m of doc.rawContent.matchAll(pat)) {
        const from = normalizePattern(m[1])
        const to = normalizePattern(m[2])
        if (from && to && from !== to) {
          rules.push({ from, to, docPath: doc.path, raw: m[0] })
        }
      }
    }
  }

  if (rules.length === 0) return []

  const out: Divergence[] = []
  for (const [fromAbs, toList] of input.depGraph) {
    const fromRel = toRelative(fromAbs, input.root)
    for (const toAbs of toList) {
      const toRel = toRelative(toAbs, input.root)
      for (const rule of rules) {
        const fromMatches = fromRel === rule.from || fromRel.startsWith(rule.from + '/')
        const toMatches = toRel === rule.to || toRel.startsWith(rule.to + '/')
        if (fromMatches && toMatches) {
          out.push({
            type: 'forbidden_dependency',
            severity: 'error',
            message: `"${fromRel}" imports from "${toRel}" but the docs forbid this dependency (${rule.from} → ${rule.to}).`,
            filePath: fromRel,
            docPath: rule.docPath,
            evidence: rule.raw.trim(),
          })
        }
      }
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Detector: undocumented hotspot
// A file with many consumers (a structural proxy for criticality) that is
// neither mentioned in any governance doc nor covered by a domain mapping.
// ---------------------------------------------------------------------------
const HOTSPOT_CONSUMER_THRESHOLD = 5

function detectUndocumentedHotspots(input: DivergenceInput, fileSet: Set<string>): Divergence[] {
  if (input.governance.model.docs.length === 0) return []

  const declaredPatterns = input.governance.model.domainMappings.map((m) => normalizePattern(m.pattern))
  const mentioned = new Set<string>()
  for (const [key] of input.governance.fileGovernance) mentioned.add(key)

  const out: Divergence[] = []
  for (const [absPath, consumers] of input.revGraph) {
    if (consumers.length < HOTSPOT_CONSUMER_THRESHOLD) continue
    const relPath = toRelative(absPath, input.root)
    if (!fileSet.has(relPath)) continue
    if (mentioned.has(relPath)) continue
    if (declaredPatterns.some((p) => relPath === p || relPath.startsWith(p + '/'))) continue

    out.push({
      type: 'undocumented_hotspot',
      severity: 'warn',
      message: `File has ${consumers.length} consumers but is not referenced by any governance document.`,
      filePath: relPath,
      evidence: `${consumers.length} reverse dependencies`,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function normalizePattern(p: string): string {
  return p.replace(/^\/+|\/+$/g, '').trim()
}

function toRelative(absPath: string, root: string): string {
  if (path.isAbsolute(absPath)) {
    return path.relative(root, absPath)
  }
  return absPath
}
