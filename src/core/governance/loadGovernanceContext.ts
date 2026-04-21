import type { GovernanceContext, GovernanceModel, GovernanceDoc, FileGovernanceInfo } from './types.ts'
import { detectGovernanceModel } from './detectGovernanceModel.ts'

/**
 * Load governance context for the entire project.
 * This is called once at the start of `generate` and the result is passed
 * to `buildBasicNote` for each file so governance evidence can be injected.
 */
export function loadGovernanceContext(root: string): GovernanceContext | null {
  const model = detectGovernanceModel(root)
  if (!model.detected) return null

  const promptSummary = buildPromptSummary(model)
  const fileGovernance = buildFileGovernanceMap(model)

  return {
    model,
    promptSummary,
    fileGovernance,
  }
}

/**
 * Build a concise summary of governance context for LLM prompt injection.
 * Capped at ~4000 chars to avoid blowing up token budgets.
 */
function buildPromptSummary(model: GovernanceModel): string {
  const parts: string[] = []

  parts.push(`## Project governance (${model.style})`)
  parts.push(`${model.docs.length} governance documents detected.\n`)

  // Summarize each doc by category
  const byCategory = new Map<string, typeof model.docs>()
  for (const doc of model.docs) {
    const list = byCategory.get(doc.category) ?? []
    list.push(doc)
    byCategory.set(doc.category, list)
  }

  for (const [category, docs] of byCategory) {
    parts.push(`### ${category}`)
    for (const doc of docs) {
      parts.push(`- **${doc.title}** (\`${doc.path}\`)`)
      // Include first section content as a brief excerpt
      const firstSection = doc.sections.entries().next().value
      if (firstSection) {
        const excerpt = firstSection[1].slice(0, 200).replace(/\n/g, ' ').trim()
        if (excerpt) parts.push(`  ${excerpt}${firstSection[1].length > 200 ? '...' : ''}`)
      }
    }
    parts.push('')
  }

  // Include domain mappings
  if (model.domainMappings.length > 0) {
    parts.push('### Domain mappings')
    for (const m of model.domainMappings.slice(0, 20)) {
      parts.push(`- \`${m.pattern}\` → governed by \`${m.docPath}\``)
    }
  }

  const full = parts.join('\n')
  return full.slice(0, 4000)
}

/**
 * Build a map of relative file paths to their governance info.
 * A file is "governed" by a doc if:
 *   1. The doc explicitly mentions the file path or a parent directory
 *   2. The file falls under a domain mapping from architecture/structure docs
 */
function buildFileGovernanceMap(model: GovernanceModel): Map<string, FileGovernanceInfo> {
  const map = new Map<string, FileGovernanceInfo>()

  // Extract constraints and decisions from docs
  const constraintDocs = model.docs.filter((d) =>
    d.category === 'contract' || d.category === 'architecture' || d.category === 'quality',
  )
  const decisionDocs = model.docs.filter((d) =>
    d.category === 'architecture' || d.category === 'other', // ADRs are 'other'
  )

  // For each doc, find file paths mentioned in it
  for (const doc of model.docs) {
    const mentionedPaths = extractMentionedPaths(doc.rawContent)

    for (const filePath of mentionedPaths) {
      const info = map.get(filePath) ?? { governingDocs: [], constraints: [], decisions: [] }
      if (!info.governingDocs.includes(doc.path)) {
        info.governingDocs.push(doc.path)
      }
      map.set(filePath, info)
    }
  }

  // Extract constraints from quality/contract docs
  for (const doc of constraintDocs) {
    const constraints = extractConstraints(doc)
    // These apply globally — mark all files that match domain mappings
    for (const mapping of model.domainMappings) {
      if (mapping.docPath === doc.path) {
        // All files under this pattern get these constraints
        for (const [filePath, info] of map) {
          if (filePath.startsWith(mapping.pattern)) {
            info.constraints.push(...constraints.filter((c) => !info.constraints.includes(c)))
          }
        }
      }
    }
  }

  // Extract decisions from architecture/ADR docs
  for (const doc of decisionDocs) {
    const decisions = extractDecisions(doc)
    for (const [, info] of map) {
      if (info.governingDocs.includes(doc.path)) {
        info.decisions.push(...decisions.filter((d) => !info.decisions.includes(d)))
      }
    }
  }

  return map
}

/** Find file paths referenced in doc content (backtick-quoted or common patterns) */
function extractMentionedPaths(content: string): string[] {
  const paths = new Set<string>()

  // Backtick-quoted paths: `src/core/graph/buildDependencyGraph.ts`
  for (const m of content.matchAll(/`((?:src|lib|internal|pkg|packages|apps|modules|cmd)\/[\w./-]+(?:\.\w+)?)`/g)) {
    paths.add(m[1])
  }

  // Plain path-like references
  for (const m of content.matchAll(/(?:^|\s)((?:src|lib|internal|pkg)\/[\w/-]+\.\w{2,4})(?:\s|$|[,;)])/gm)) {
    paths.add(m[1])
  }

  return [...paths]
}

/** Extract constraints from quality/contract documents */
function extractConstraints(doc: GovernanceDoc): string[] {
  const constraints: string[] = []

  for (const [heading, content] of doc.sections) {
    const headingLower = heading.toLowerCase()
    if (
      headingLower.includes('constraint') ||
      headingLower.includes('rule') ||
      headingLower.includes('invariant') ||
      headingLower.includes('requirement') ||
      headingLower.includes('must') ||
      headingLower.includes('validation')
    ) {
      // Extract bullet points
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.slice(2).trim()
          if (text.length > 10 && text.length < 300) {
            constraints.push(text)
          }
        }
      }
    }
  }

  return constraints.slice(0, 20)
}

/** Extract architectural decisions from architecture/ADR documents */
function extractDecisions(doc: GovernanceDoc): string[] {
  const decisions: string[] = []

  for (const [heading, content] of doc.sections) {
    const headingLower = heading.toLowerCase()
    if (
      headingLower.includes('decision') ||
      headingLower.includes('adr') ||
      headingLower.includes('rationale') ||
      headingLower.includes('why') ||
      headingLower.includes('chose') ||
      headingLower.includes('trade-off')
    ) {
      // Extract bullet points and short paragraphs
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if ((trimmed.startsWith('- ') || trimmed.startsWith('* ')) && trimmed.length > 10 && trimmed.length < 300) {
          decisions.push(trimmed.slice(2).trim())
        }
      }
    }
  }

  return decisions.slice(0, 20)
}
