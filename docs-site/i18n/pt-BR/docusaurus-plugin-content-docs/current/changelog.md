---
sidebar_position: 99
---

# Changelog

Todas as mudanças notáveis no braito são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

### Added
- **Painel de execução ao vivo** — botão "▶ Run generate" dispara o pipeline completo pelo browser; painel inferior mostra cada etapa em tempo real com timestamps e ícones emoji; atualiza automaticamente ao terminar; checkbox `--force` disponível
- **Aba Tests** — terceira aba no painel de detalhes com badge de status de cobertura, barra de cobertura de linhas, lista de arquivos de teste relacionados, e dica de ação para arquivos sem testes
- **Barra de estatísticas de cobertura** — contagens globais (covered / uncovered / avg coverage) acima da lista de arquivos, via `/api/stats`
- **`debugSignals` em cada nota** — todos os sinais brutos do pipeline agora armazenados em cada `.json`, alimentando o score breakdown da aba Debug

### Changed
- **`purpose.observed`** — agora exibe assinaturas de função tipadas completas (`name(param: Tipo): ReturnType`) e a primeira linha do JSDoc, em vez de apenas listas de nomes de exports
- **Contexto do prompt LLM** — substituiu o truncamento nas primeiras 200 linhas pela extração de esqueleto semântico: exports + JSDoc + comentários especiais (DECISION/INVARIANT/WHY/HACK)
- **System prompt** — adicionados exemplos RUIM/BOM por campo para todos os seis campos da nota, evitando que o LLM produza resumos genéricos de listas de exports
- **Constituição do projeto** (`braito.context.md`) — arquivo opcional na raiz do projeto injetado em todo prompt de síntese LLM; permite que times definam vocabulário de domínio, restrições arquiteturais e áreas de risco
- **Slash commands para agentes** (`init --agent`) — gera `.claude/commands/braito-note.md`, `braito-impact.md`, `braito-search.md` no projeto alvo para que as ferramentas do braito fiquem disponíveis como slash commands nativos no Claude Code e Cursor
- **Site de docs migrado para Docusaurus** — reconstruído com Docusaurus v3, suporte completo a i18n (EN + PT-BR), homepage personalizada, modo escuro

---

## [0.6.0] — 2026-04-04

### Added
- **Changelog por arquivo** (`recentChanges[]`) — cada nota agora inclui os últimos 10 commits do arquivo (hash, data ISO, mensagem, autor); renderizado como `## Recent Changes` nos sidecars `.md` e visível na aba Debug da UI
- **Aba Debug na Interface Web** — segunda aba no painel de detalhes com: barras de breakdown do score de criticidade, trilha completa de evidências com badges de tipo (`code`, `git`, `test`, `graph`, `comment`, `doc`), e changelog por arquivo
- **Saída LLM multilíngue** — campo `language` no config (BCP 47) e flag `--language / -l` na CLI; conteúdo sintetizado pelo LLM é gerado no idioma configurado; prioridade: flag `--language` > config > padrão (`en`)
- **Ferramenta MCP `get_impact`** — BFS sobre `dependents[]` retornando análise de raio de impacto: total de arquivos afetados + breakdown por nível com criticidade e domínio
- **Ferramenta MCP `search`** — busca de texto completo em todos os arrays `observed[]`, `inferred[]` e `evidence[].detail` de todas as notas
- **Ferramenta MCP `get_domain`** — todos os arquivos em um domínio ordenados por criticidade, com contagem e score médio
- **`dependents[]` no IndexEntry** — lista de dependentes reversos persistida em cada entrada do índice

### Fixed
- Path traversal na UI e no MCP — validação de caminho antes de servir arquivos
- `apiKey` removido do schema de config — chaves de API somente via variáveis de ambiente
- Guard de escape de caminho de saída em `writeJsonNote`

---

## [0.5.0] — 2026-03-29

### Added
- Extensão VS Code com decorações e hover provider
- `generate --dry-run`, `generate --diff`, `generate --filter`
- Testes e2e de CLI (22 testes)
- Servidor MCP com `get_file_note`, `search_by_criticality`, `get_index`, `get_architecture_context`
- `mcp --auto-generate`, indicador de progresso, timeout LLM, retry com backoff exponencial
- Validação de config com Zod, logger estruturado, schema versioning
- Detecção de ciclos, processamento concorrente, cobertura de testes
- Interface web local (porta 7842)
- Suporte a Python e Go via opt-in

---

## [1.0.0] — 2026-03-29

### Added
- Scanner, analisador AST, grafo de dependências, inteligência git, cache, camada LLM, publisher de saída
- Comandos CLI: `scan`, `generate`, `watch`
- Workflow CI GitHub Actions
- Modelo de domínio: `AiFileNote` com separação `observed`/`inferred`
- Suite completa de testes
