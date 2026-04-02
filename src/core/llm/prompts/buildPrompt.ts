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

  return `Analise o arquivo abaixo e gere uma nota operacional em português brasileiro.

Arquivo: ${analysis.filePath}
${exportList}

Contexto estático:
${JSON.stringify(staticContext, null, 2)}

Dependências reversas (consumidores):
${graph.reverseDependencies.slice(0, 5).join('\n') || 'nenhum'}

Sinais do Git:
${JSON.stringify({ churnScore: git.churnScore, recentCommitMessages: git.recentCommitMessages, coChangedFiles: git.coChangedFiles.slice(0, 5), authorCount: git.authorCount }, null, 2)}

Testes relacionados:
${tests.relatedTests.join('\n') || 'nenhum'}

Já observado (não repita, use como contexto):
${JSON.stringify(existingObserved, null, 2)}

Código-fonte:
\`\`\`typescript
${sourceCode}
\`\`\`

Retorne um objeto JSON com estes campos:
{
  "summary": "2-3 frases descrevendo: (1) o que este arquivo faz, (2) para que serve cada export/função/interface/classe principal e como funciona, (3) por que ele existe no codebase. Seja específico — mencione nomes reais de funções, campos de interfaces, parâmetros e comportamento. OBRIGATÓRIO.",
  "purpose": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "invariants": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "sensitiveDependencies": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "importantDecisions": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "knownPitfalls": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] },
  "impactValidation": { "observed": [], "inferred": [], "confidence": 0.0, "evidence": [] }
}

Para "purpose.inferred": uma string simples por export principal descrevendo o que ele faz — ex: "runGenerate: orquestra o pipeline completo de geração de notas, recebe args com root/force/filter/diff, escreve .json e .md por arquivo e reconstrói o índice". Use strings simples, NÃO objetos.
evidence items: { "type": "code"|"git"|"test"|"graph"|"comment"|"doc", "detail": "string" }
Retorne APENAS o objeto JSON, sem markdown.`
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
