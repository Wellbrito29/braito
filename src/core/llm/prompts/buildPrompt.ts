import fs from 'node:fs'
import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../../types/file-analysis.ts'
import type { AiFileNote } from '../../types/ai-note.ts'

const MAX_SOURCE_LINES = 200

export type PromptContext = {
  analysis: StaticFileAnalysis
  graph: GraphSignals
  tests: TestSignals
  git: GitSignals
  staticNote: AiFileNote
}

export function buildPrompt(ctx: PromptContext): string {
  const { analysis, graph, tests, git, staticNote } = ctx

  const sourceCode = readSourceTruncated(analysis.filePath)

  const staticContext = {
    imports: analysis.imports,
    exports: analysis.exports,
    hooks: analysis.hooks,
    envVars: analysis.envVars,
    apiCalls: analysis.apiCalls,
    comments: analysis.comments,
    hasSideEffects: analysis.hasSideEffects,
  }

  const existingObserved = {
    purpose: staticNote.purpose.observed,
    sensitiveDependencies: staticNote.sensitiveDependencies.observed,
    knownPitfalls: staticNote.knownPitfalls.observed,
    impactValidation: staticNote.impactValidation.observed,
  }

  const exportList = analysis.exports.length > 0
    ? `Exported symbols to describe: ${analysis.exports.join(', ')}`
    : ''

  return `Analyze the file below and generate an operational note.

File: ${analysis.filePath}
${exportList}

Static context:
${JSON.stringify(staticContext, null, 2)}

Reverse dependencies (consumers):
${graph.reverseDependencies.slice(0, 5).join('\n') || 'none'}

Git signals:
${JSON.stringify({ churnScore: git.churnScore, recentCommitMessages: git.recentCommitMessages, coChangedFiles: git.coChangedFiles.slice(0, 5), authorCount: git.authorCount }, null, 2)}

Related tests:
${tests.relatedTests.join('\n') || 'none'}

Already observed (do not repeat, use as context):
${JSON.stringify(existingObserved, null, 2)}

Source code:
\`\`\`typescript
${sourceCode}
\`\`\`

Return a JSON object with these fields:
{
  "summary": "2-3 sentences describing: (1) what this file does, (2) what each main export/function/interface/class is for and how it works, (3) why it exists in the codebase. Be specific — mention actual function names, interface fields, parameters, and behaviour. REQUIRED.",
  "purpose": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "invariants": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "sensitiveDependencies": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "importantDecisions": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "knownPitfalls": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "impactValidation": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] }
}

For "purpose.inferred": one plain string per major export describing what it does — e.g. "IRepositoryFindOptions: defines filter (FilterQuery), sort (object), and pagination (skip/limit) options for repository queries". Use plain strings, NOT objects.
evidence items: { "type": "code"|"git"|"test"|"graph"|"comment"|"doc", "detail": "string" }
Return ONLY the JSON object, no markdown wrapping.`
}

function readSourceTruncated(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    if (lines.length <= MAX_SOURCE_LINES) return content
    return lines.slice(0, MAX_SOURCE_LINES).join('\n') + `\n// ... (truncated at ${MAX_SOURCE_LINES} lines)`
  } catch {
    return '// source not available'
  }
}
