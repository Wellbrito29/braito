# Descrição do Projeto

## Visão

O projeto `AI File Notes` é uma ferramenta para gerar memória operacional por arquivo em codebases grandes. A intenção não é criar um changelog por arquivo, e sim uma camada de conhecimento prático para humanos e agentes de IA.

Em vez de responder apenas “o que este arquivo faz?”, a ferramenta tenta responder:

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
- arquivos “sensíveis” que parecem simples
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
- times que usam Copilot, Cursor, ChatGPT ou agentes internos
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

## Resultado esperado

Gerar artefatos em `.ai-notes/` como:

- `.json` para integração com ferramentas
- `.md` para leitura humana
- índice geral por criticidade
- opcionalmente cabeçalhos inline em arquivos críticos
