# Modelo de Domínio e Schema

## Entidades principais

### DiscoveredFile

```ts
export type DiscoveredFile = {
  path: string
  extension: string
  size: number
  domain?: string
}
```

### StaticFileAnalysis

```ts
export type StaticFileAnalysis = {
  filePath: string
  imports: string[]
  localImports: string[]
  externalImports: string[]
  exports: string[]
  symbols: string[]
  hooks: string[]
  envVars: string[]
  apiCalls: string[]
  comments: {
    todo: string[]
    fixme: string[]
    hack: string[]
  }
  hasSideEffects: boolean
  rawSummary: string
}
```

### GitSignals

```ts
export type GitSignals = {
  filePath: string
  churnScore: number
  recentCommitMessages: string[]
  coChangedFiles: Array<{ path: string; count: number }>
  authorCount: number
}
```

### TestSignals

```ts
export type TestSignals = {
  filePath: string
  relatedTests: string[]
  validationTargets: string[]
}
```

### FileContextPacket

```ts
export type FileContextPacket = {
  filePath: string
  sourceCode: string
  staticAnalysis: StaticFileAnalysis
  reverseDependencies: string[]
  gitSignals: GitSignals
  testSignals: TestSignals
  domainContext?: string
  criticalityScore: number
}
```

## Schema de evidência

```ts
export type EvidenceItem = {
  type: 'code' | 'git' | 'test' | 'graph' | 'comment' | 'doc'
  detail: string
}
```

## Campo estruturado recomendado

```ts
export type StructuredListField = {
  observed: string[]
  inferred: string[]
  confidence: number
  evidence: EvidenceItem[]
}
```

## Schema principal da nota

```ts
export type AiFileNote = {
  filePath: string
  purpose: StructuredListField
  invariants: StructuredListField
  sensitiveDependencies: StructuredListField
  importantDecisions: StructuredListField
  knownPitfalls: StructuredListField
  impactValidation: StructuredListField
  criticalityScore: number
  generatedAt: string
  model: string
}
```

## Recomendações de modelagem

1. Nunca usar apenas texto livre no topo do sistema.
2. Toda síntese deve carregar `confidence`.
3. Sempre manter evidência junto da conclusão.
4. Diferenciar `observed` e `inferred`.
5. Permitir campos vazios quando não houver base suficiente.

## Exemplo de saída

```json
{
  "filePath": "packages/search/src/useImageSearch.ts",
  "purpose": {
    "observed": [
      "Exporta um hook chamado useImageSearch",
      "Consome um client de busca por imagem"
    ],
    "inferred": [
      "Orquestra o fluxo de busca por imagem e prepara o resultado para consumidores"
    ],
    "confidence": 0.91,
    "evidence": [
      { "type": "code", "detail": "export function useImageSearch" },
      { "type": "graph", "detail": "É consumido por SearchScreen.tsx" }
    ]
  },
  "invariants": {
    "observed": [
      "Retorna dados usados por consumidores da UI"
    ],
    "inferred": [
      "Deve preservar o shape esperado pela tela de busca"
    ],
    "confidence": 0.76,
    "evidence": [
      { "type": "code", "detail": "Campos retornados são lidos pela SearchScreen" }
    ]
  },
  "sensitiveDependencies": {
    "observed": [
      "searchApi.searchByImage",
      "SearchScreen.tsx"
    ],
    "inferred": [],
    "confidence": 0.94,
    "evidence": [
      { "type": "code", "detail": "Import direto do client searchApi" },
      { "type": "graph", "detail": "Dependência reversa da SearchScreen" }
    ]
  },
  "importantDecisions": {
    "observed": [],
    "inferred": [],
    "confidence": 0.22,
    "evidence": []
  },
  "knownPitfalls": {
    "observed": [
      "Há um comentário TODO sobre compatibilidade legada"
    ],
    "inferred": [
      "Mudanças na normalização podem impactar analytics e ordenação"
    ],
    "confidence": 0.68,
    "evidence": [
      { "type": "comment", "detail": "TODO: remover fallback legado" },
      { "type": "git", "detail": "Arquivo co-muda com SearchScreen e tracking" }
    ]
  },
  "impactValidation": {
    "observed": [
      "SearchScreen.tsx",
      "tests/useImageSearch.spec.ts"
    ],
    "inferred": [
      "Validar eventos de analytics de busca"
    ],
    "confidence": 0.87,
    "evidence": [
      { "type": "graph", "detail": "Dependência reversa da SearchScreen" },
      { "type": "test", "detail": "Teste relacionado encontrado por nome e import" }
    ]
  },
  "criticalityScore": 0.81,
  "generatedAt": "2026-03-27T00:00:00.000Z",
  "model": "gpt-5"
}
```
