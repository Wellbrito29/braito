# Arquitetura

## Visão geral

O pipeline é dividido em seis blocos principais:

1. scanner
2. analisador estático (AST)
3. grafo de dependências
4. inteligência git
5. sintetizador LLM
6. publisher de saída

## Pipeline

```
repo → scanner → analisador AST → grafo de dependências → inteligência git
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
- exports com assinaturas tipadas e JSDoc
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

## 4. Inteligência Git

Cruza sinais históricos: score de churn, mensagens de commits recentes com hash e autor, arquivos co-modificados, contagem de autores.

## 5. Inteligência de Testes

Mapeia pontos de validação: testes relacionados por heurística de nome, cobertura real de linhas via `lcov.info` ou `coverage-summary.json`.

## 6. Sintetizador LLM

Recebe o pacote de contexto do arquivo — incluindo o esqueleto de código (assinaturas exportadas + JSDoc) em vez das primeiras N linhas — e gera todos os campos da nota. Regras:

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
