# Roadmap

## Curto prazo

### Milestone 1

- scanner funcional
- parser TS/TSX
- imports/exports
- dependências reversas
- testes relacionados
- JSON sidecar

### Milestone 2

- score de criticidade
- sinais do Git
- TODO/FIXME/HACK
- Markdown sidecar

### Milestone 3

- integração com LLM
- schema validado
- observed vs inferred
- confidence + evidence

## Médio prazo

### Milestone 4

- cache incremental
- watch mode
- filtros por domínio
- índice agregado por criticidade

### Milestone 5

- integração com CI
- saída em PR comments
- geração seletiva por changed files

## Longo prazo

### Milestone 6

- suporte multi-language
- tree-sitter ou plugins por linguagem
- melhor detecção de contratos e invariantes

### Milestone 7

- integração com docs/ADRs/PRs automaticamente
- richer graph
- visualização de impacto por arquivo

### Milestone 8

- agente de revisão que consome as notas
- prompts especializados por tipo de arquivo
- explicações de impacto durante code review

## Critérios de evolução

A cada milestone, medir:

- tempo de execução
- precisão percebida
- utilidade para onboarding
- utilidade para revisão de PR
- taxa de aceitação das notas pelos devs
