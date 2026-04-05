---
sidebar_position: 4
---

# Interface Web

O braito inclui uma SPA local para navegar pelas notas geradas.

## Iniciar

```bash
bun src/cli/index.ts ui --root ./
# → http://localhost:7842
```

Porta customizada:

```bash
bun src/cli/index.ts ui --root ./ --port 3000
```

## Funcionalidades

### Barra lateral

- **Busca** — filtra arquivos pelo caminho enquanto você digita
- **Filtro de score** — exibe apenas arquivos acima de um threshold de criticidade (padrão 0.5+)
- **Agrupamento por domínio** — arquivos agrupados por domínio de pasta, ordenados por score máximo decrescente
- **Badge stale** — indicador ⚠ para notas mais antigas que `staleThresholdDays`
- **Badge de score** — colorido: vermelho (≥0.7), amarelo (≥0.4), verde (&lt;0.4)

### Aba Nota

Exibe os seis campos semânticos do arquivo selecionado:

| Campo | Conteúdo |
|---|---|
| **Purpose** | O que o arquivo faz e por que existe |
| **Invariants** | Contratos e suposições que devem ser mantidos |
| **Important Decisions** | Escolhas arquiteturais com sinais reais |
| **Known Pitfalls** | Modos de falha: TODOs, commits arriscados, co-mudanças |
| **Sensitive Dependencies** | Pacotes externos, env vars, consumidores de alta fanout |
| **Impact Validation** | Onde verificar antes de fazer deploy |

Cada campo exibe itens `observed` (da análise estática) e itens `inferred` (do LLM, em itálico).

### Aba Debug

Revela a análise completa por trás de cada nota:

| Seção | Conteúdo |
|---|---|
| **Score breakdown** | Barras por sinal mostrando cada contribuição ao score de criticidade com labels `+X.XX` |
| **Trilha de evidências** | Todos os itens `evidence[]` de todos os campos, com badges de tipo (`code`, `git`, `test`, `graph`, `comment`, `doc`) |
| **Co-changed files** | Arquivos que costumam mudar juntos com este (do histórico git), ordenados por frequência de co-mudança |
| **Changelog** | Últimos 10 commits do arquivo: hash curto, data, mensagem, autor |

A aba Debug é especialmente útil para entender por que um arquivo tem score alto — você vê exatamente quais sinais impulsionaram o resultado.

### Aba Tests

Exibe sinais de cobertura de testes para o arquivo selecionado:

| Seção | Conteúdo |
|---|---|
| **Badge de status** | **Covered ✓** (verde) ou **Uncovered ✗** (vermelho) com base na detecção de arquivos de teste |
| **Barra de cobertura** | Percentual de cobertura de linhas com barra colorida (verde ≥70%, amarelo ≥40%, vermelho &lt;40%) |
| **Arquivos de teste relacionados** | Arquivos de teste associados a este arquivo fonte |
| **Sinais brutos** | `hasTests`, `coveragePct`, `churnScore`, `authorCount` do `debugSignals` |

Arquivos sem testes e com consumidores têm penalidade de criticidade maior (+0.15 vs +0.05), tornando a aba Tests um guia útil de onde adicionar testes primeiro.

### Estatísticas de cobertura de testes

Uma barra de estatísticas acima da lista de arquivos mostra a cobertura global de testes:

- **files** — total de notas geradas
- **covered** — arquivos com pelo menos um teste relacionado detectado
- **uncovered** — arquivos sem testes
- **avg cov** — cobertura média de linhas nos arquivos que têm dados de cobertura

### Executar o generate pela UI

O botão **▶ Run generate** no cabeçalho dispara o pipeline completo diretamente do browser sem abrir um terminal.

```
▶ Run generate   [ ] --force
```

Um painel de log sobe da parte inferior mostrando cada etapa em tempo real:

```
12:04:01 · braito.context.md carregado — injetando contexto do projeto…
12:04:01 📂 Found 24 files
12:04:02 🔍 Analyzing files…
12:04:03 💾 Reused 18 cached analyses (skipped ts-morph parse)
12:04:03 🕸 Building dependency graph…
12:04:04 ✍ Writing notes…
12:04:05 ✅ Generated 6 notes in .ai-notes/
12:04:05 ⏭ Skipped 18 unchanged files (use --force to reprocess)
```

Marque **--force** para ignorar o cache e reprocessar todos os arquivos. Marque **--verbose** para ver o detalhe de sinais por arquivo (veja abaixo). A lista de arquivos e as estatísticas de cobertura atualizam automaticamente quando o run termina.

### Modo verbose

Com **--verbose** marcado, o painel de log exibe uma linha detalhada para cada arquivo processado:

```
0.82  src/core/types/ai-note.ts  deps=0 consumers=8 churn=12  [no-tests LLM]
0.71  src/core/output/buildBasicNote.ts  deps=6 consumers=3 churn=8  [ext-imports LLM]
0.45  src/core/utils/logger.ts  deps=1 consumers=5 churn=3  []
```

Cada linha mostra: score de criticidade · caminho do arquivo · contagens de dependências e consumidores · churn · flags de sinais ativos.

Ao final do run, o modo verbose também exibe:

- **Top 5 arquivos por consumidores** — os arquivos mais importados do grafo (maior raio de impacto)
- **Top 5 arquivos por score** — os arquivos com maior criticidade
- **Arquivos sem testes** — contagem de arquivos não cobertos vs total

Use o modo verbose para entender por que os scores estão altos, identificar gargalos e decidir onde adicionar testes ou reduzir acoplamento.
