# Project Description

## Vision

`braito` (AI File Notes) is a tool for generating operational memory per file in large codebases. The intent is not to create a per-file changelog, but a layer of practical knowledge for humans and AI agents.

Instead of just answering "what does this file do?", the tool tries to answer:

- what is the purpose of the file
- what must not be broken
- which dependencies require care
- what decisions appear to have been made
- what risks or pitfalls exist
- where to validate impact before shipping a change

## Problem it solves

Large projects accumulate:

- implicit couplings
- undocumented contracts
- forgotten decisions
- "sensitive" files that look simple
- rework for onboarding and maintenance
- difficulty for AI to understand the real project context

This tool reduces that cost by generating actionable notes per file.

## What it is not

- does not replace ADRs
- does not replace PRs and Git history
- is not complete functional documentation
- must not invent architecture without evidence
- must not try to understand the entire system at once

## Target audience

- engineering teams with monorepos
- mobile/web/backend squads with shared code
- teams using Copilot, Cursor, or internal AI agents
- tech leads who want to reduce the risk of lateral changes

## Ideal use cases

- central hook used by multiple screens
- adapter between API and UI
- search/recommendation service
- file with high churn in Git
- central reducers/stores/contexts
- critical design system components
- gateways for analytics, feature flags, env vars, and authentication

## Value proposition

### For humans

- faster onboarding
- less time to understand critical files
- lower risk of hidden impact
- support for code review

### For AI agents

- better grounding per file
- richer context for vibe coding
- less need for large prompts
- lower chance of changes breaking lateral flows

---

# Descrição do Projeto

## Visão

O `braito` (AI File Notes) é uma ferramenta para gerar memória operacional por arquivo em codebases grandes. A intenção não é criar um changelog por arquivo, e sim uma camada de conhecimento prático para humanos e agentes de IA.

Em vez de responder apenas "o que este arquivo faz?", a ferramenta tenta responder:

- qual é o propósito do arquivo
- o que não deve ser quebrado
- quais dependências exigem cuidado
- quais decisões parecem ter sido tomadas
- quais riscos ou armadilhas existem
- onde validar impacto antes de subir alteração

## Problema que resolve

Projetos grandes acumulam:

- acoplamentos implícitos
- contratos não documentados
- decisões esquecidas
- arquivos "sensíveis" que parecem simples
- retrabalho para onboarding e manutenção
- dificuldade para IA entender contexto real do projeto

Essa ferramenta reduz esse custo gerando notas acionáveis por arquivo.

## O que ela não é

- não substitui ADRs
- não substitui PRs e histórico do Git
- não é documentação funcional completa
- não deve inventar arquitetura sem evidência
- não deve tentar entender todo o sistema de uma vez

## Público-alvo

- times de engenharia com monorepo
- squads mobile/web/backend com código compartilhado
- times que usam Copilot, Cursor ou agentes internos
- líderes técnicos que querem reduzir risco de mudanças laterais

## Casos ideais

- hook central usado por várias telas
- adapter entre API e UI
- serviço de busca/recomendação
- arquivo com alto churn no Git
- reducers/stores/contexts centrais
- componentes críticos do design system
- gateways para analytics, feature flags, env e autenticação

## Proposta de valor

### Para humanos

- onboarding mais rápido
- menor tempo para entender arquivos críticos
- menos risco de impacto escondido
- suporte à revisão de código

### Para IA

- mais grounding por arquivo
- melhor contexto para vibe coding
- menor necessidade de prompt enorme
- menos chance de mudança quebrar fluxo lateral
