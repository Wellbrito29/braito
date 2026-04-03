# Architecture

## Overview

The pipeline is divided into six main blocks:

1. scanner
2. static analyzer (AST)
3. graph engine
4. git intelligence
5. LLM synthesizer
6. output publisher

## Pipeline

```
repo → scanner → AST analyzer → graph engine → git intelligence
     → [cache check] → static note → [LLM synthesis] → write .json + .md + index
```

**Key constraint:** LLM sits at the synthesis edge only. The majority of the pipeline is deterministic and auditable.

## 1. Scanner

Responsibilities:

- discover eligible files via `Bun.Glob`
- apply include/exclude patterns
- respect ignore rules
- classify domain from folder structure

Output: list of candidate files with path, extension, size.

## 2. Static Analyzer (AST)

Extracts facts from source code:

- imports (static + dynamic `import()`)
- exports
- relevant symbols (functions, classes, interfaces)
- React/Vue hooks
- env var usage
- API calls
- comments: `TODO`, `FIXME`, `HACK`, `INVARIANT`, `DECISION`, `WHY`

Implementation:
- TypeScript/JavaScript: `ts-morph`
- Python: regex-based analyzer
- Go: regex-based analyzer with `go.mod` module path resolution

## 3. Graph Engine

Builds:

- direct dependency graph (who this file imports)
- reverse dependency graph (who imports this file)
- domain grouping
- cycle detection

Import resolution handles relative paths, `tsconfig.paths` aliases, and bundler aliases (Vite, Webpack, Metro).

## 4. Git Intelligence

Crosses historical signals: churn score, recent commit messages, co-changed files, author count.

## 5. Test Intelligence

Maps validation points: related tests by name heuristic, real line coverage from `lcov.info` or `coverage-summary.json`.

## 6. LLM Synthesizer

Receives the file context package and generates all note fields. Rules:

- differentiate observed from inferred
- include evidence
- return confidence scores
- never invent decisions without supporting signals
- fall back to static note on any error or timeout

## 7. Output Publisher

Writes `.ai-notes/<path>.json`, `.ai-notes/<path>.md`, `index.json`, `index.md`.

## Layer breakdown

| Layer | Path | Responsibility |
|---|---|---|
| CLI | `src/cli/` | Command orchestration — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Core | `src/core/` | All business logic |
| Output | `src/core/output/` | JSON/Markdown serialization, index building |
| Cache | `src/core/cache/` | SHA-1 per file, skip unchanged, stale detection |

## Key architectural decision

The LLM must stay **at the synthesis edge**, not at the center of the pipeline. Files are only sent to LLM when `criticalityScore >= llmThreshold` (default `0.4`).

---

# Arquitetura

## Visão geral

O pipeline é dividido em seis blocos principais:

1. scanner
2. analisador estático (AST)
3. grafo de dependências
4. sinais do git
5. síntese por LLM
6. publisher de saída

## Pipeline

```
repo → scanner → analisador AST → grafo de dependências → sinais do git
     → [verificação de cache] → nota estática → [síntese LLM] → grava .json + .md + index
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
- exports
- símbolos relevantes (funções, classes, interfaces)
- hooks React/Vue
- uso de variáveis de ambiente
- chamadas de API
- comentários: `TODO`, `FIXME`, `HACK`, `INVARIANT`, `DECISION`, `WHY`

Implementação:
- TypeScript/JavaScript: `ts-morph`
- Python: analisador baseado em regex
- Go: analisador baseado em regex com resolução de módulo via `go.mod`

## 3. Grafo de Dependências

Constrói:

- grafo de dependências diretas (o que este arquivo importa)
- grafo de dependências reversas (quem importa este arquivo)
- agrupamento por domínio
- detecção de ciclos

Resolução de imports trata caminhos relativos, aliases de `tsconfig.paths` e aliases de bundlers (Vite, Webpack, Metro).

## 4. Sinais do Git

Cruza sinais históricos: score de churn, mensagens de commits recentes, arquivos que mudam juntos, contagem de autores.

## 5. Inteligência de Testes

Mapeia pontos de validação: testes relacionados por heurística de nome, cobertura real de linhas via `lcov.info` ou `coverage-summary.json`.

## 6. Sintetizador LLM

Recebe o pacote de contexto do arquivo e gera todos os campos da nota. Regras:

- diferenciar observado de inferido
- incluir evidências
- retornar scores de confiança
- nunca inventar decisões sem sinais de suporte
- fallback para nota estática em caso de erro ou timeout

## 7. Publisher de Saída

Grava `.ai-notes/<caminho>.json`, `.ai-notes/<caminho>.md`, `index.json`, `index.md`.

## Camadas

| Camada | Caminho | Responsabilidade |
|---|---|---|
| CLI | `src/cli/` | Orquestração dos comandos — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Core | `src/core/` | Toda a lógica de negócio |
| Output | `src/core/output/` | Serialização JSON/Markdown, construção do índice |
| Cache | `src/core/cache/` | SHA-1 por arquivo, pular inalterados, detecção de notas antigas |

## Decisão arquitetural principal

O LLM deve ficar **na borda de síntese**, não no centro do pipeline. Arquivos só são enviados ao LLM quando `criticalityScore >= llmThreshold` (padrão `0.4`).
