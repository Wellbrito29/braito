import fs from 'node:fs'
import path from 'node:path'
import type { StaticFileAnalysis, GraphSignals, TestSignals, GitSignals } from '../../types/file-analysis.ts'
import type { AiFileNote } from '../../types/ai-note.ts'

export type PromptContext = {
  analysis: StaticFileAnalysis
  graph: GraphSignals
  tests: TestSignals
  git: GitSignals
  staticNote: AiFileNote
  maxSourceLines?: number
  localImportExports?: Map<string, string[]>
}

type FileType = 'hook' | 'type-definition' | 'service' | 'utility'

function detectFileType(analysis: StaticFileAnalysis): FileType {
  if (analysis.hooks.length > 0) return 'hook'
  const fp = analysis.filePath.toLowerCase()
  if (fp.endsWith('.types.ts') || fp.endsWith('.dto.ts') || fp.endsWith('.interface.ts')) return 'type-definition'
  if (analysis.exports.some((e) => /Service|Provider|Repository|Store|Manager$/i.test(e))) return 'service'
  if (analysis.apiCalls.length > 0) return 'service'
  return 'utility'
}

function specializedInstructions(type: FileType): string {
  switch (type) {
    case 'hook':
      return `Este arquivo exporta React hooks. Para cada hook:
- Descreva o que ele gerencia (estado, efeito, ref, contexto)
- Liste os parâmetros de entrada e o valor retornado
- Identifique dependências implícitas (contextos, globals, DOM APIs)
- Aponte regras de hooks que se aplicam (ordem de chamada, não chamar condicionalmente)
- Documente side effects: quais APIs externas ou efeitos colaterais são disparados`

    case 'type-definition':
      return `Este arquivo define tipos, interfaces ou DTOs. Para cada tipo exportado:
- Descreva o propósito do tipo e em qual contexto ele é usado
- Liste cada campo com seu tipo e o que ele representa
- Indique quais campos são obrigatórios vs opcionais
- Aponte restrições ou invariantes (ex: IDs sempre positivos, datas em UTC)
- Identifique relações entre tipos (composição, herança)`

    case 'service':
      return `Este arquivo implementa um service, provider ou repositório. Descreva:
- O contrato principal: quais operações expõe e quais dados manipula
- Dependências injetadas ou importadas e seu papel
- Cada método público: parâmetros, valor de retorno, efeitos colaterais
- Possíveis erros lançados e em quais condições
- Estado gerenciado internamente (se houver)`

    default:
      return `Para cada função ou símbolo exportado:
- Descreva o que faz, seus parâmetros e valor de retorno
- Identifique casos de borda e comportamentos não óbvios
- Aponte dependências implícitas ou acoplamentos inesperados`
  }
}

function readSource(filePath: string, maxLines?: number): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    if (!maxLines) return content
    const lines = content.split('\n')
    if (lines.length <= maxLines) return content
    return lines.slice(0, maxLines).join('\n') + `\n// ... (truncado em ${maxLines} linhas)`
  } catch {
    return '// código-fonte não disponível'
  }
}

function extractJsdoc(sourceCode: string): string[] {
  const jsdocPattern = /\/\*\*[\s\S]*?\*\//g
  const matches = [...sourceCode.matchAll(jsdocPattern)]
  return matches
    .map((m) => m[0].trim())
    .filter((doc) => doc.length > 20)
    .slice(0, 10)
}

function readTestContents(relatedTests: string[], maxLinesPerTest = 80): string {
  if (relatedTests.length === 0) return 'nenhum'
  const parts: string[] = []
  for (const testPath of relatedTests.slice(0, 3)) {
    try {
      const content = fs.readFileSync(testPath, 'utf-8')
      const lines = content.split('\n').slice(0, maxLinesPerTest).join('\n')
      parts.push(`// ${path.basename(testPath)}\n${lines}`)
    } catch {
      parts.push(`// ${path.basename(testPath)} — não disponível`)
    }
  }
  return parts.join('\n\n---\n\n')
}

export function buildPrompt(ctx: PromptContext): string {
  const { analysis, graph, tests, git, staticNote, maxSourceLines, localImportExports } = ctx

  const sourceCode = readSource(analysis.filePath, maxSourceLines)
  const jsdoc = extractJsdoc(sourceCode)
  const testContents = readTestContents(tests.relatedTests)
  const fileType = detectFileType(analysis)

  const staticContext = {
    imports: analysis.imports,
    exports: analysis.exports,
    signatures: analysis.signatures,
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

  const importedExportsSection = (() => {
    if (!localImportExports || localImportExports.size === 0) return 'não disponível'
    return [...localImportExports.entries()]
      .map(([imp, exps]) => `${imp}: [${exps.join(', ')}]`)
      .join('\n')
  })()

  return `Analise o arquivo abaixo e gere uma nota operacional em português brasileiro.

Arquivo: ${analysis.filePath}
Tipo de arquivo detectado: ${fileType}

${specializedInstructions(fileType)}

---

Assinaturas dos símbolos exportados:
${analysis.signatures.length > 0 ? analysis.signatures.join('\n') : 'nenhuma extraída'}

Contexto estático:
${JSON.stringify(staticContext, null, 2)}

Exports dos arquivos importados localmente (contratos disponíveis):
${importedExportsSection}

Dependências reversas (consumidores deste arquivo):
${graph.reverseDependencies.slice(0, 8).join('\n') || 'nenhum'}

Sinais do Git:
${JSON.stringify({ churnScore: git.churnScore, recentCommitMessages: git.recentCommitMessages, coChangedFiles: git.coChangedFiles.slice(0, 5), authorCount: git.authorCount }, null, 2)}

JSDoc existente no arquivo:
${jsdoc.length > 0 ? jsdoc.join('\n\n') : 'nenhum'}

Arquivos de teste relacionados (conteúdo parcial):
\`\`\`
${testContents}
\`\`\`

Já observado (não repita, use como contexto):
${JSON.stringify(existingObserved, null, 2)}

Código-fonte completo:
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

Instruções por campo:
- "purpose.inferred": um item por export principal — descreva o que faz, parâmetros, retorno, campos (para interfaces) ou efeitos. Ex: "buildPrompt(ctx: PromptContext): string — monta o prompt LLM com código-fonte, assinaturas e sinais de git/teste; retorna string formatada com instruções por tipo de arquivo"
- "invariants.inferred": liste cada validação, guard de permissão, schema Zod/yup, condição que lança erro, ou constraint implícita no código
- "knownPitfalls.inferred": side effects não óbvios, mutações de estado compartilhado, dependências de ordem de execução, comportamentos surpreendentes
- "importantDecisions.inferred": tradeoffs visíveis no código, padrões não óbvios, por que algo foi feito de determinada forma
- "sensitiveDependencies.inferred": dependências externas críticas, APIs que podem falhar, env vars sem fallback
- "impactValidation.inferred": o que quebraria se este arquivo mudar — consumidores, integrações, contratos
evidence items: { "type": "code"|"git"|"test"|"graph"|"comment"|"doc", "detail": "string" }
Retorne APENAS o objeto JSON, sem markdown.`
}
