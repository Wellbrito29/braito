---
sidebar_position: 1
---

# Arquitetura

## Visão geral

O pipeline é dividido nos seguintes blocos:

1. scanner
2. analisador estático (AST)
3. grafo de dependências
4. inteligência git
5. inteligência de testes
6. camada de cache
7. carregador de contexto de governança
8. sintetizador LLM (apenas na borda)
9. publisher de saída
10. extrator de regras de negócio (sob demanda, via MCP)

## Pipeline

```
repo → scanner → analisador AST → grafo de dependências → inteligência git
     → [verificação de cache] → contexto de governança → nota estática
     → [síntese LLM se criticalityScore ≥ llmThreshold]
     → grava .json + .md + index + graph.json + search-index.json
```

**Restrição principal:** o LLM fica apenas na borda de síntese. A maior parte do pipeline é determinística e auditável.

## 1. Scanner

Responsabilidades:

- descobrir arquivos elegíveis via `Bun.Glob`
- aplicar padrões include/exclude
- respeitar regras de ignore
- classificar domínio pela estrutura de pastas

Saída: lista de arquivos candidatos com path, extensão e tamanho.

## 2. Analisador Estático (AST)

Extrai fatos do código fonte:

- imports (estáticos + `import()` dinâmicos)
- exports com assinaturas completas e JSDoc (`exportDetails`)
- símbolos relevantes (funções, classes, interfaces)
- hooks React/Vue
- uso de variáveis de ambiente
- chamadas de API (URLs literais passadas a `fetch`/`axios`/`got`/`request`)
- comentários: `TODO`, `FIXME`, `HACK`, `INVARIANT`, `DECISION`, `WHY`, `ENSURES`, `ADR`
- assinaturas tipadas (`extractSignatures` — parâmetros+retorno, campos de interface, type aliases)

Implementação:

- TypeScript/JavaScript: `ts-morph`, com um extractor por arquivo em `analyzers/ts/`
- Python: analisador baseado em regex (respeita `__all__`; trata imports multi-linha)
- Go: analisador baseado em regex com resolução de módulo via `go.mod`; captura métodos com receivers

## 3. Grafo de Dependências

Constrói:

- grafo de dependências diretas (o que este arquivo importa)
- grafo de dependências reversas (quem importa este arquivo)
- agrupamento por domínio
- detecção de ciclos

Resolução de imports trata caminhos relativos, aliases de `tsconfig.paths` e aliases de bundlers (Vite, Webpack, Metro). O grafo é persistido em `.ai-notes/graph.json` para consultas transitivas posteriores pela tool MCP `get_impact`.

## 4. Inteligência Git

Cruza sinais históricos via CLI `git`: score de churn, mensagens de commits recentes, arquivos co-modificados, contagem de autores.

## 5. Inteligência de Testes

Mapeia pontos de validação: testes relacionados por heurística de nome, cobertura real de linhas via `lcov.info` ou `coverage-summary.json`.

## 6. Camada de Cache

SHA-1 por arquivo em `cache/hashes.json`. Execuções incrementais pulam o parse `ts-morph` e a síntese LLM quando o hash não muda. `isNoteStale` marca notas mais antigas que `staleThresholdDays` (padrão 30).

## 7. Contexto de Governança

`src/core/governance/` detecta documentação do projeto (`Docs/brief.md`, `Docs/architecture.md`, `Workflows/`, `Quality/`, `Skills/`, `ADR/`) e monta um `GovernanceContext`. `buildBasicNote` liga cada arquivo aos seus documentos governantes via `evidence.type: 'doc'`. Exposto a agentes pela tool MCP `get_governance_context`.

## 8. Sintetizador LLM

Recebe o pacote de contexto do arquivo e gera todos os campos `inferred` da nota. Regras:

- diferenciar `observed` de `inferred`
- incluir evidências com fontes tipadas
- retornar scores de confiança
- nunca inventar decisões sem sinais de suporte
- fallback para nota estática em caso de erro ou timeout

A detecção de tipo de arquivo roteia arquivos de definição de tipos (`*.types.ts`, `*.dto.ts` etc.) por um prompt especializado. O `braito.context.md` (opcional) é prepended em todos os prompts como constituição do projeto.

## 9. Publisher de Saída

Grava `.ai-notes/<caminho>.json`, `.ai-notes/<caminho>.md`, `index.json`, `index.md`, `graph.json` e `search-index.json` (BM25 via MiniSearch).

## 10. Extrator de Regras de Negócio

`src/core/business/extractBusinessRules.ts` é invocado sob demanda pela tool MCP `get_business_rules`. Extrai limites numéricos, guards de permissão, validações de schema, constantes de negócio e throws condicionais de um único arquivo sem rodar o pipeline completo.

## Camadas

| Camada | Caminho | Responsabilidade |
|---|---|---|
| CLI | `src/cli/` | Orquestração — `scan`, `generate`, `watch`, `mcp`, `ui`, `init`, `update` |
| Core | `src/core/` | Toda a lógica de negócio |
| Output | `src/core/output/` | Serialização JSON/Markdown, índice, persistência do grafo, índice de busca BM25 |
| Cache | `src/core/cache/` | SHA-1 por arquivo, pular inalterados, detecção de notas antigas |
| Governance | `src/core/governance/` | Detectar docs do projeto (Docs/, Workflows/, Quality/); injetar evidência `doc` nas notas |
| Business | `src/core/business/` | Extratores heurísticos estáticos para regras de domínio (consumidos sob demanda pelo MCP) |

## Decisão arquitetural principal

O LLM deve ficar **na borda de síntese**, não no centro do pipeline. Arquivos só são enviados ao LLM quando `criticalityScore >= llmThreshold` (padrão `0.4`).
