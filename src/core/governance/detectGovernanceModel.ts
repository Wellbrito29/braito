import fs from 'node:fs'
import path from 'node:path'
import type { GovernanceModel, GovernanceDoc } from './types.ts'

/**
 * Well-known governance document paths (NebulaSpecKit-style and common alternatives).
 * Each entry maps a relative path pattern to a category.
 */
const KNOWN_DOCS: Array<{ glob: string; category: GovernanceDoc['category'] }> = [
  // NebulaSpecKit conventions
  { glob: 'Docs/brief.md', category: 'brief' },
  { glob: 'Docs/project.md', category: 'brief' },
  { glob: 'Docs/architecture.md', category: 'architecture' },
  { glob: 'Docs/contract.yaml', category: 'contract' },
  { glob: 'Docs/contract.md', category: 'contract' },
  { glob: 'Docs/structure.md', category: 'structure' },
  { glob: 'Docs/stack.md', category: 'stack' },
  { glob: 'Docs/plan.md', category: 'plan' },
  { glob: 'Docs/tasks.md', category: 'tasks' },
  { glob: 'Docs/control.md', category: 'other' },
  // Common alternatives
  { glob: 'docs/architecture.md', category: 'architecture' },
  { glob: 'docs/ARCHITECTURE.md', category: 'architecture' },
  { glob: 'ARCHITECTURE.md', category: 'architecture' },
  { glob: 'docs/ADR', category: 'other' },  // ADR directory
  { glob: 'ADR', category: 'other' },
]

/** Directories to scan for governance docs (glob-free, just scan direct children) */
const GOVERNANCE_DIRS: Array<{ dir: string; category: GovernanceDoc['category'] }> = [
  { dir: 'Workflows', category: 'workflow' },
  { dir: 'Quality', category: 'quality' },
  { dir: 'Skills', category: 'skill' },
  { dir: 'docs/workflows', category: 'workflow' },
  { dir: 'docs/quality', category: 'quality' },
]

const MAX_DOC_CHARS = 8000

/**
 * Detect and load governance documents from the project root.
 * Returns a GovernanceModel describing the detected governance style and all found documents.
 */
export function detectGovernanceModel(root: string): GovernanceModel {
  const docs: GovernanceDoc[] = []

  // Scan well-known files
  for (const entry of KNOWN_DOCS) {
    const fullPath = path.join(root, entry.glob)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const doc = loadGovernanceDoc(fullPath, root, entry.category)
      if (doc) docs.push(doc)
    } else if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      // Scan directory for markdown files (e.g. ADR/)
      for (const file of scanDirForMarkdown(fullPath)) {
        const doc = loadGovernanceDoc(file, root, entry.category)
        if (doc) docs.push(doc)
      }
    }
  }

  // Scan governance directories
  for (const entry of GOVERNANCE_DIRS) {
    const dirPath = path.join(root, entry.dir)
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      for (const file of scanDirForMarkdown(dirPath)) {
        const doc = loadGovernanceDoc(file, root, entry.category)
        if (doc) docs.push(doc)
      }
    }
  }

  // Determine governance style
  const nebulaIndicators = ['Docs/brief.md', 'Docs/project.md', 'Docs/architecture.md', 'Docs/plan.md']
  const nebulaCount = nebulaIndicators.filter((p) => docs.some((d) => d.path === p)).length
  const style = nebulaCount >= 3 ? 'nebula-like' : docs.length > 0 ? 'custom' : 'none'

  // Build domain mappings from architecture/structure docs
  const domainMappings = extractDomainMappings(docs)

  return {
    detected: docs.length > 0,
    style,
    docs,
    domainMappings,
  }
}

function scanDirForMarkdown(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath)
      .filter((f) => f.endsWith('.md') || f.endsWith('.yaml') || f.endsWith('.yml'))
      .map((f) => path.join(dirPath, f))
  } catch {
    return []
  }
}

function loadGovernanceDoc(filePath: string, root: string, category: GovernanceDoc['category']): GovernanceDoc | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const content = raw.slice(0, MAX_DOC_CHARS)
    const relativePath = path.relative(root, filePath)
    const sections = extractSections(content)
    const title = extractTitle(content, path.basename(filePath, path.extname(filePath)))

    return {
      path: relativePath,
      category,
      title,
      sections,
      rawContent: content,
    }
  } catch {
    return null
  }
}

/** Extract markdown sections by heading level 1/2/3 */
function extractSections(content: string): Map<string, string> {
  const sections = new Map<string, string>()
  const lines = content.split('\n')
  let currentHeading = ''
  let currentContent: string[] = []

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      if (currentHeading && currentContent.length > 0) {
        sections.set(currentHeading, currentContent.join('\n').trim())
      }
      currentHeading = headingMatch[2].trim()
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }

  if (currentHeading && currentContent.length > 0) {
    sections.set(currentHeading, currentContent.join('\n').trim())
  }

  return sections
}

/** Extract the document title from the first heading or fallback to filename */
function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)/m)
  return match ? match[1].trim() : fallback
}

/** Extract domain mappings from architecture/structure documents */
function extractDomainMappings(docs: GovernanceDoc[]): Array<{ pattern: string; docPath: string }> {
  const mappings: Array<{ pattern: string; docPath: string }> = []

  for (const doc of docs) {
    if (doc.category !== 'architecture' && doc.category !== 'structure') continue

    // Look for path-like patterns in the document (e.g. "src/core/", "internal/")
    for (const [heading, content] of doc.sections) {
      // Find directory references in the content
      const pathMatches = content.matchAll(/[`"']?((?:src|lib|internal|pkg|packages|apps|modules)\/[\w/-]+)[`"']?/g)
      for (const match of pathMatches) {
        mappings.push({ pattern: match[1], docPath: doc.path })
      }
    }
  }

  return mappings
}
