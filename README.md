# AI File Notes

Documentação base para um projeto que analisa um repositório e gera notas operacionais por arquivo, com foco em codebases densas, monorepos e times que usam IA para acelerar entendimento e manutenção.

## Objetivo

Construir uma ferramenta que:

- varre o repositório
- identifica arquivos relevantes
- extrai sinais estáticos do código
- cruza dependências, testes e histórico do Git
- monta contexto por arquivo
- usa um LLM para sintetizar conhecimento operacional
- publica notas em Markdown e JSON em `.ai-notes/`

## O que a ferramenta gera

Para cada arquivo crítico ou relevante, a ferramenta tenta produzir:

- propósito do arquivo
- invariantes
- dependências sensíveis
- decisões importantes
- armadilhas conhecidas
- onde validar impacto

## Princípios do projeto

1. **Não depender só de LLM**: a base deve vir de análise estática, grafo de dependências, testes e Git.
2. **Contexto reduzido por arquivo**: nunca mandar o repositório inteiro para o modelo.
3. **Separar observado de inferido**: reduzir alucinação e aumentar confiança.
4. **Publicar sidecar primeiro**: evitar poluir a codebase com comentários inline no início.
5. **Priorizar arquivos críticos**: hooks centrais, adapters, gateways, telas críticas, reducers, serviços e pontos com alto churn.

## Estrutura sugerida desta documentação

- `docs/PROJECT_DESCRIPTION.md`
- `docs/ARCHITECTURE.md`
- `docs/FILE_STRUCTURE.md`
- `docs/DOMAIN_MODEL_AND_SCHEMA.md`
- `docs/LLM_STRATEGY.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/RECOMMENDATIONS.md`
- `docs/ROADMAP.md`

## Fluxo resumido

1. scanner encontra arquivos
2. analyzer extrai AST e sinais objetivos
3. graph monta dependências diretas e reversas
4. git intelligence cruza churn, commits e co-change
5. test intelligence encontra testes relacionados
6. context builder empacota evidências por arquivo
7. llm synthesizer gera a nota estruturada
8. publisher grava `.json` e `.md`

## Saída esperada

Exemplo simplificado:

```json
{
  "filePath": "packages/search/src/useImageSearch.ts",
  "purpose": {
    "observed": ["Exporta um hook chamado useImageSearch"],
    "inferred": ["Orquestra o fluxo de busca por imagem"],
    "confidence": 0.89,
    "evidence": [
      { "type": "code", "detail": "export function useImageSearch" }
    ]
  }
}
```

## Onde isso brilha

- monorepos TypeScript
- React / React Native / Node
- projetos com muita regra implícita
- módulos compartilhados
- times que usam IA para code review, suporte e onboarding

## Primeiro passo prático

Começar pelo MVP sem exagero:

- scanner
- análise de imports/exports
- grafo de dependências
- testes relacionados
- JSON sidecar
- só depois adicionar Git intelligence e LLM
