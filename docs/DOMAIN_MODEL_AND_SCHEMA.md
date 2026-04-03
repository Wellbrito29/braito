# Domain Model and Schema

## Core types

### AiFileNote

The primary output type — one per analyzed file.

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
  criticalityScore: number   // 0–1
  generatedAt: string        // ISO 8601
  model: string              // "static" | "<llm-model-name>"
}
```

### StructuredListField

Every note field uses this shape. The `observed`/`inferred` split is mandatory — never collapse them.

```ts
type StructuredListField = {
  observed: string[]       // facts from static analysis, git, tests
  inferred: string[]       // LLM synthesis (empty when model = "static")
  confidence: number       // 0–1
  evidence: EvidenceItem[]
}

type EvidenceItem = {
  type: 'code' | 'git' | 'test' | 'graph' | 'comment' | 'doc'
  detail: string
}
```

### NoteIndex

The aggregated index written to `.ai-notes/index.json`.

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
  purpose: string        // first observed purpose string
  generatedAt: string
  stale: boolean
  dependents: string[]   // relative paths of files that import this one
}
```

## Modeling rules

1. Never use plain free text at the top level — always use structured fields.
2. Every synthesis must carry a `confidence` value.
3. Always keep evidence alongside the conclusion.
4. Differentiate `observed` from `inferred`.
5. Allow fields to be empty when there is not enough basis.

## Example note

```json
{
  "schemaVersion": "1.0.0",
  "filePath": "src/core/llm/synthesizeFileNote.ts",
  "purpose": {
    "observed": ["Exports synthesizeFileNote function", "Calls LLM provider with file context"],
    "inferred": ["Orchestrates LLM synthesis with timeout and retry, merging static and inferred fields"],
    "confidence": 0.91,
    "evidence": [
      { "type": "code", "detail": "export async function synthesizeFileNote" },
      { "type": "graph", "detail": "Called by generate.ts and watch.ts" }
    ]
  },
  "criticalityScore": 0.82,
  "generatedAt": "2026-04-01T00:00:00.000Z",
  "model": "claude-sonnet-4-6"
}
```

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
  criticalityScore: number   // 0–1
  generatedAt: string        // ISO 8601
  model: string              // "static" | "<nome-do-modelo-llm>"
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
  purpose: string        // primeiro string de purpose observado
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
