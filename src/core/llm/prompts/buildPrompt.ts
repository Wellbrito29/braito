import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../../types/file-analysis.ts'
import type { AiFileNote } from '../../types/ai-note.ts'
import { extractSkeleton } from '../../ast/extractSkeleton.ts'

export type PromptContext = {
  analysis: StaticFileAnalysis
  graph: GraphSignals
  tests: TestSignals
  git: GitSignals
  staticNote: AiFileNote
}

export function buildPrompt(ctx: PromptContext): string {
  const { analysis, graph, tests, git, staticNote } = ctx

  const sourceCode = extractSkeleton(analysis.filePath)

  const staticContext = {
    imports: analysis.imports,
    exports: analysis.exports,
    exportDetails: analysis.exportDetails,
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

  return `Analyze the file below and generate an operational note.

File: ${analysis.filePath}

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

Return a JSON object with these fields. Each field follows the StructuredListField schema:
{
  "purpose": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "invariants": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "sensitiveDependencies": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "importantDecisions": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "knownPitfalls": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "impactValidation": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] }
}

evidence items: { "type": "code"|"git"|"test"|"graph"|"comment"|"doc", "detail": "string" }
Return ONLY the JSON object, no markdown wrapping.`
}

