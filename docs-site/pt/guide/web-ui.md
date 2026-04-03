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
- **Badge de score** — colorido: vermelho (≥0.7), amarelo (≥0.4), verde (<0.4)

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
| **Score breakdown** | Barras de sinal por campo mostrando o que contribuiu para o score de criticidade |
| **Trilha de evidências** | Todos os itens `evidence[]` de todos os campos, com badges de tipo (`code`, `git`, `test`, `graph`, `comment`, `doc`) |
| **Changelog** | Últimos 10 commits do arquivo: hash curto, data, mensagem, autor |

A aba Debug é especialmente útil para entender por que uma nota está vaga — você vê exatamente quais sinais estavam disponíveis no momento da análise.
