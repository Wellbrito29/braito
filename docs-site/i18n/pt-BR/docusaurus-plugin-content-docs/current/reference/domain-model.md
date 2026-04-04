---
sidebar_position: 2
---

# Modelo de Domínio e Schema

## Tipos principais

### AiFileNote

O tipo de saída principal — um por arquivo analisado.

```ts
type AiFileNote = {
  schemaVersion: string
  filePath: string
  purpose: StructuredListField
  invariants: StructuredListField
  sensitiveDependencies: StructuredListField
  importantDecisions: StructuredListField
  knownPitfalls: StructuredListField
  impactValidation: StructuredListField
  recentChanges: ChangelogEntry[]   // últimos 10 commits do arquivo
  criticalityScore: number          // 0–1
  generatedAt: string               // ISO 8601
  model: string                     // "static" | "<nome-do-modelo-llm>"
}
```

### StructuredListField

Cada campo da nota usa esse formato. A separação `observed`/`inferred` é obrigatória — nunca colapse os dois.

```ts
type StructuredListField = {
  observed: string[]       // fatos da análise estática, git, testes
  inferred: string[]       // síntese LLM (vazio quando model = "static")
  confidence: number       // 0–1
  evidence: EvidenceItem[]
}

type EvidenceItem = {
  type: 'code' | 'git' | 'test' | 'graph' | 'comment' | 'doc'
  detail: string
}
```

### ChangelogEntry

Entrada do histórico de commits por arquivo.

```ts
type ChangelogEntry = {
  hash: string    // hash completo do commit
  date: string    // ISO 8601
  message: string // subject do commit
  author: string  // nome do autor
}
```

### NoteIndex

O índice agregado gravado em `.ai-notes/index.json`.

```ts
type NoteIndex = {
  schemaVersion: string
  generatedAt: string
  totalFiles: number
  synthesizedFiles: number
  staleFiles: number
  entries: IndexEntry[]
}

type IndexEntry = {
  filePath: string
  relativePath: string
  domain: string
  criticalityScore: number
  model: string
  purpose: string        // primeiro item do observed de purpose
  generatedAt: string
  stale: boolean
  dependents: string[]   // caminhos relativos dos arquivos que importam este
}
```

## Regras de modelagem

1. Nunca usar apenas texto livre no topo — sempre usar campos estruturados.
2. Toda síntese deve carregar `confidence`.
3. Sempre manter evidência junto da conclusão.
4. Diferenciar `observed` e `inferred`.
5. Permitir campos vazios quando não houver base suficiente.

## Exemplo de nota

```json
{
  "schemaVersion": "1.0.0",
  "filePath": "src/core/llm/synthesizeFileNote.ts",
  "purpose": {
    "observed": [
      "Export: synthesizeFileNote(ctx: PromptContext, provider: LLMProvider, temperature?: number, timeoutMs?: number, language?: string): Promise<AiFileNote>"
    ],
    "inferred": ["Orquestra síntese LLM com retry e timeout, mesclando campos estáticos e inferidos"],
    "confidence": 0.91,
    "evidence": [
      { "type": "code", "detail": "export async function synthesizeFileNote" },
      { "type": "graph", "detail": "Consumido por: generate.ts e watch.ts" }
    ]
  },
  "recentChanges": [
    { "hash": "abc1234...", "date": "2026-04-01T00:00:00Z", "message": "feat: add language param", "author": "Wellington Nascimento" }
  ],
  "criticalityScore": 0.82,
  "generatedAt": "2026-04-01T00:00:00.000Z",
  "model": "claude-sonnet-4-6"
}
```
