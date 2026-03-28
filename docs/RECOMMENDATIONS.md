# Recomendações

## Técnicas

### 1. Comece por TypeScript

Mesmo que a arquitetura permita expansão futura, o MVP deve focar em TS/TSX. Isso reduz complexidade e acelera entrega.

### 2. Use `ts-morph` no início

Ele facilita muito extração de imports, exports, símbolos e navegação básica sem te forçar a lidar cedo demais com detalhes baixos da Compiler API.

### 3. Sidecar antes de inline

Comece gerando `.md` e `.json` em `.ai-notes/`. Só depois considere cabeçalhos no topo do arquivo.

### 4. Não gere para tudo de uma vez

Priorize:

- alto churn
- muitos dependentes
- serviços centrais
- hooks compartilhados
- arquivos sem teste
- integrações com API/analytics/env

### 5. Trate `importantDecisions` com ceticismo

Esse campo é o mais sujeito a alucinação. Só preencha com confiança alta quando houver:

- comentário explícito
- doc do domínio
- commit forte
- padrão muito evidente

### 6. Separe fato de inferência

Isso é essencial para confiança operacional. Nunca entregue só prosa bonita.

### 7. Mantenha tudo auditável

Toda nota deveria poder ser explicada por:

- trecho do código
- relação no grafo
- teste encontrado
- comentário
- commit

### 8. Resolva aliases cedo

Monorepos costumam depender de:

- `tsconfig paths`
- aliases do bundler
- pacotes workspace

Sem isso, o grafo fica capenga.

## Produto

### 1. Pense como ferramenta de suporte, não como verdade absoluta

As notas devem orientar, não substituir julgamento técnico.

### 2. Mostre confiança e evidência na UI ou output

Isso aumenta adoção e reduz desconfiança.

### 3. Tenha modo incremental

Projetos grandes não podem reprocessar tudo a cada execução.

### 4. Gere índice por criticidade

Isso ajuda a focar primeiro nos arquivos mais valiosos.

## Operacionais

### 1. Cache obrigatório

Faça cache por hash do arquivo + sinais. Isso reduz custo e tempo.

### 2. Ignore gerados e ruído

Filtre:

- `node_modules`
- `dist`
- `build`
- snapshots
- arquivos gerados
- storybook output
- cobertura

### 3. CI só depois do pipeline estabilizar

Primeiro rode localmente e ajuste qualidade. Depois leve para CI.

### 4. Tenha fallback sem LLM

O sistema deve continuar útil mesmo quando o provider falhar.

## Recomendações de saída

### JSON

- melhor para integração com outras ferramentas
- obrigatório no pipeline

### Markdown

- melhor para leitura humana
- ótimo para revisão manual

### Inline header

- útil só em arquivos muito críticos
- deve ser opcional
