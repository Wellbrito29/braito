# Arquitetura

## Visão geral

A arquitetura é dividida em seis blocos principais:

1. scanner
2. static analyzer
3. graph engine
4. git intelligence
5. context builder
6. llm synthesizer + publisher

## 1. Scanner

Responsável por:

- descobrir arquivos elegíveis
- aplicar include/exclude
- respeitar ignore patterns
- classificar domínio ou pasta

Entradas:

- raiz do projeto
- globs configurados
- lista de exclusão

Saída:

- lista de arquivos candidatos

## 2. Static Analyzer

Responsável por extrair fatos do código:

- imports
- exports
- símbolos relevantes
- hooks
- uso de env vars
- chamadas de API
- side effects
- comentários `TODO`, `FIXME`, `HACK`

Preferência inicial:

- TypeScript Compiler API ou `ts-morph`

## 3. Graph Engine

Constrói:

- dependências diretas
- dependências reversas
- agrupamentos por domínio
- arquivos relacionados por importação

Esse bloco é central para impacto e criticidade.

## 4. Git Intelligence

Cruza sinais históricos:

- churn por arquivo
- commits recentes
- arquivos que mudam juntos
- mensagens relevantes
- hints de “hotfix”, “rollback”, “legacy”, “analytics”, “compat”

Objetivo:

- aumentar qualidade de `knownPitfalls`
- melhorar `importantDecisions`
- priorizar arquivos mais sensíveis

## 5. Test Intelligence

Mapeia possíveis pontos de validação:

- testes relacionados por nome
- imports em arquivos de teste
- testes da mesma pasta ou domínio
- cobertura indireta por co-change

## 6. Context Builder

Empacota só o contexto necessário para um arquivo:

- código do arquivo atual
- análise estática
- dependentes principais
- testes relacionados
- sinais do Git
- contexto do domínio

Princípio:

- contexto curto, rico e baseado em evidência

## 7. LLM Synthesizer

Recebe o pacote do arquivo e gera:

- purpose
- invariants
- sensitiveDependencies
- importantDecisions
- knownPitfalls
- impactValidation

Regras:

- diferenciar observado e inferido
- incluir evidências
- devolver confiança
- não inventar decisões sem suporte

## 8. Publisher

Publica resultados em:

- `.json`
- `.md`
- índice agregado
- opcionalmente header inline

## Fluxo fim a fim

```text
repo -> scanner -> analyzer -> graph -> git/test signals -> context builder -> llm -> publisher
```

## Camadas sugeridas

### CLI

Comandos como:

- `scan`
- `generate`
- `publish`
- `watch`

### Core

- parsing
- graph
- git
- context
- ranking

### Output

- serialização
- sidecar Markdown/JSON
- indexação

## Decisão arquitetural importante

O LLM deve ficar **na borda de síntese**, não no centro do pipeline. A maior parte do trabalho deve ser determinística e auditável.
