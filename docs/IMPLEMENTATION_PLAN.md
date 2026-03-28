# Plano de Implementação

## Fase 1 — MVP determinístico

Objetivo: gerar valor sem depender demais de LLM.

### Entregas

- scanner do repositório
- parser TS/TSX
- extração de imports/exports
- grafo de dependências
- descoberta de testes relacionados
- geração de `.json` sidecar com dados básicos

### Campos que já dá para produzir

- purpose heurístico
- sensitiveDependencies
- impactValidation

### Resultado esperado

Conseguir rodar algo como:

```bash
ai-notes scan
ai-notes generate
```

## Fase 2 — Enriquecimento com histórico

### Entregas

- churn por arquivo
- commits recentes
- arquivos que mudam juntos
- score de criticidade
- captura de TODO/FIXME/HACK

### Campos melhorados

- knownPitfalls
- impactValidation
- priorização por criticidade

## Fase 3 — Síntese com LLM

### Entregas

- prompt builder
- provider de LLM
- schema com validação
- JSON final com `observed`, `inferred`, `confidence`, `evidence`
- Markdown sidecar

### Campos completos

- purpose
- invariants
- sensitiveDependencies
- importantDecisions
- knownPitfalls
- impactValidation

## Fase 4 — Operação e manutenção

### Entregas

- cache por hash
- watch mode
- índice geral por criticidade
- filtros por pasta/domínio
- CI para atualização automática

## Sequência sugerida de trabalho

1. criar config do projeto
2. montar scanner
3. implementar parser TS/TSX
4. montar grafo direto/reverso
5. descobrir testes
6. serializar JSON básico
7. adicionar Git signals
8. criar ranking de criticidade
9. integrar LLM
10. gerar Markdown
11. adicionar cache
12. adicionar watch/CI

## Critério de pronto do MVP

- roda em monorepo TS
- consegue analisar arquivos TS/TSX
- gera nota em `.ai-notes/`
- não explode em arquivos gerados
- consegue apontar consumidores e testes relacionados

## Riscos de implementação

### Dependências dinâmicas

Imports dinâmicos e resolução custom podem reduzir precisão do grafo.

### Monorepo com aliases

Será necessário resolver `paths` do `tsconfig` e possíveis aliases do bundler.

### Testes indiretos

Nem todo impacto terá teste óbvio; usar heurística e deixar claro quando for inferência.

### Custo de LLM

Mitigar com cache e execução incremental.
