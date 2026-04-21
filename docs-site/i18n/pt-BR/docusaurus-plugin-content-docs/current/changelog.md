---
sidebar_position: 99
---

# Changelog

Todas as mudanças notáveis no braito são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

### Added
- **Staleness transitiva via fingerprints de dependência** — cada nota captura os hashes das deps diretas no momento da geração (persistidos em `cache/dep-fingerprints.json`); próximo run trata o arquivo como cache hit apenas quando o hash do próprio arquivo E o hash de cada dep batem; caso contrário, a nota é re-sintetizada. Pega conteúdo inferido defasado tipo "chama `findBySku`" depois que o callee foi renomeado. 12 testes unit + 3 e2e.
- **Quality harness (modo estático)** — `tests/quality/qualityHarness.test.ts` roda `generate` contra uma fixture curada de 6 arquivos (`tests/fixtures/quality-harness/`) e valida por arquivo regex patterns em `purpose.observed`, `invariants.observed` e `knownPitfalls.observed`; floor agregado protege médias repo-wide; roda em <600ms, sem LLM nem API key; detecta regressões em classificação por nome, categorização de imports, inferências cross-signal, extratores AST e wiring de agregação
- **Modelos LLM em tiers** — novos campos `llm.highModel` e `llm.highThreshold` (padrão `0.7`) em `ai-notes.config.ts`; `generate` instancia um segundo provider fixado em `highModel` e roteia arquivos cuja `criticalityScore >= highThreshold` através dele; os demais continuam usando o `model` padrão; permite gastar orçamento apenas nos arquivos mais arriscados (ex: Opus para críticos, Sonnet para o resto); o resumo final informa quantos arquivos foram sintetizados pelo tier premium
- **Provider Claude CLI** — novo `provider: 'claude-cli'` em `ai-notes.config.ts` dispara o binário local `claude` (`claude -p --output-format json`) para síntese; autentica via sua sessão já logada no Claude Code, sem exigir `ANTHROPIC_API_KEY`; envia o prompt do usuário via stdin, o system prompt via `--system-prompt` (substitui completamente o prompt padrão para evitar vazamento de memória/preferências do usuário); expõe métricas de custo e duração; integrado ao `LLMProviderName`, ao schema de config e ao factory
- **Detecção de divergências de governança** — novo `src/core/governance/detectDivergence.ts` compara docs de governança contra o código e o grafo reais; quatro detectores sinalizam `missing_file` (docs referenciam um arquivo que não existe), `undeclared_domain` (arquivo vive fora de todo domínio declarado pelos docs de arquitetura), `forbidden_dependency` (aresta do grafo viola uma regra "`src/X` não deve depender de `src/Y`" extraída do texto dos docs) e `undocumented_hotspot` (≥5 dependentes reversos, sem cobertura em docs); integrado ao `runGenerate` logo após o carregamento do contexto de governança; divergências por arquivo injetadas em `knownPitfalls.observed` com `evidence.type: 'doc'`; todas as divergências persistidas em `.ai-notes/divergences.json`; nova ferramenta MCP `get_divergences` com filtros opcionais `severity`/`type`; 11 testes em `tests/governance/detectDivergence.test.ts`
- **MCP multi-repo** — `mcp --roots "alias=/caminho,..."` registra múltiplos repositórios em um mesmo servidor MCP; chamadas de ferramenta aceitam um argumento `repo`; nova ferramenta `list_repos` enumera os repositórios registrados; comportamento single-repo via `--root` permanece inalterado
- **UI do Graph — ciclos, modo Focus e painel de análise** — `GET /api/graph/cycles` roda Tarjan SCC iterativo e retorna ciclos + set de membros; `GET /api/graph/analysis?path=X` retorna a posição do arquivo no grafo (in/out degree, dependents/deps transitivos via BFS, distribuição de domínios vizinhos, participação em ciclo, flag `hotspot`); aba Graph agora tem toggle Global/Focus com ego-network de 1–3 hops, slider de profundidade, checkboxes por domínio, arestas coloridas (upstream azul / downstream vermelho / ciclos vermelhos) e painel de análise lateral; correção de direção invertida das arestas no fallback do `index.json`
- **`exportDetails` e `signatures` para Python/Go** — ambos os analisadores agora extraem metadados ricos: Python extrai assinaturas de funções com params/return types, classes com bases, e docstrings; Go extrai assinaturas de funções com receivers, campos de structs e métodos de interfaces; Python respeita `__all__` e trata imports multiline; Go captura métodos exportados com receivers
- **Índice de busca BM25** — `generate` constrói `.ai-notes/search-index.json` via MiniSearch; a ferramenta MCP `search` usa busca ranqueada com fuzzy matching e prefix; fallback para scan linear quando índice ausente
- **Aba Graph na UI** — visualização interativa de grafo de dependências com D3.js force-directed; nós coloridos por domínio, dimensionados por criticidade; arestas direcionais; click-to-detail, zoom/pan/drag, highlight de vizinhos, filtro por score
- **Análise com governança** — novo módulo `src/core/governance/` detecta docs do projeto (`Docs/`, `Workflows/`, `Quality/`) e injeta `evidence.type: 'doc'` nas notas; nova ferramenta MCP `get_governance_context`; `get_architecture_context` enriquecido com resumo de governança
- **Ferramenta MCP `get_business_rules`** — extrai estaticamente regras de negócio, restrições de domínio e padrões de validação
- **Persistência do grafo** — `generate` grava `.ai-notes/graph.json` com nós e arestas; `get_impact` usa para BFS transitivo completo
- **Comando `update`** — re-executa `generate` apenas para arquivos stale no `index.json`
- **Enriquecimento da análise LLM** — assinaturas tipadas completas via ts-morph, conteúdo de testes nos prompts, extração de JSDoc, prompts especializados por tipo de arquivo
- **Notas mais ricas para arquivos de tipo/interface** — caminho de prompt dedicado para `*.types.ts`, `*.dto.ts`, etc.
- **Painel de execução ao vivo** — botão "▶ Run generate" dispara o pipeline completo pelo browser; painel inferior mostra cada etapa em tempo real com timestamps e ícones emoji; atualiza automaticamente ao terminar; checkboxes `--force` e `--verbose` disponíveis
- **Flag `--verbose` no `generate`** — linha por arquivo com score, contagens de deps/consumidores, churn e flags de sinais; timing de parse por arquivo; top-5 consumidores e top-5 por score ao final; contagem de arquivos sem testes
- **Timers por fase** — scan, analyze, graph e write registram tempo decorrido; etapa de grafo registra contagem de nós + arestas; tempo total ao final
- **Aba Tests** — terceira aba no painel de detalhes com badge de status de cobertura, barra de cobertura de linhas, lista de arquivos de teste relacionados, e dica de ação para arquivos sem testes
- **Barra de estatísticas de cobertura** — contagens globais (covered / uncovered / avg coverage) acima da lista de arquivos, via `/api/stats`
- **Scripts `package.json`** — `bun run scan/generate/generate:force/generate:dry/generate:v/watch/mcp/ui/init:agent` substituem as invocações verbosas `bun src/cli/index.ts …`
- **`debugSignals` em cada nota** — todos os sinais brutos do pipeline agora armazenados em cada `.json`, alimentando o score breakdown da aba Debug

### Changed
- **Enriquecimento de notas estáticas v2** — `enrichStaticSignals.ts` mescla classificação por nome de arquivo (`*.controller.ts`, `*.service.ts`, `*.dto.ts`, `*.use-case.ts`, etc. → labels humanos de propósito), categorização de imports (DB/HTTP/fila/cache/auth/logging → invariants), e inferências cross-signal ("consumers sem testes", "baixa cobertura + N consumers", "arquivo volátil", "módulo com side-effect") nos arrays `observed[]` de cada nota; medido no repo exemplo de 74 arquivos: média `purpose.observed` 1.0 → 1.9, `knownPitfalls.observed` ~0 → 1.3 por nota estática
- **Peso de co-change normalizado pelo churn** — `computeCriticality` agora compara `maxCoChange` com o próprio `churnScore` do arquivo; `+0.15` quando a razão é `≥0.6` com ≥3 co-changes, `+0.10` quando a razão é `≥0.4` com ≥2; a heurística funciona em qualquer repositório, independente do nível de atividade
- **Keywords de decisão cientes de idioma** — `buildBasicNote` escolhe a tabela de keywords pelo `config.language` (inglês, português, espanhol, francês, alemão, italiano, com fallback para o tag base em regionais como `pt-PT → pt`); prefixos de conventional commits `refactor:`, `revert:`, `perf:` são reconhecidos via regex em qualquer idioma
- **Detecção expandida de efeitos colaterais** — a lista padrão de pacotes cobre agora observabilidade (sentry, datadog, newrelic, opentelemetry, …), analytics (mixpanel, amplitude, segment, …), filas (amqp, kafkajs, nats, …), agendadores (bullmq, bull, agenda, …), realtime, caches e feature flags
- **Dicas de análise configuráveis** — novos `analysis.sideEffectPackages` e `analysis.apiCallPatterns` em `ai-notes.config.ts` permitem registrar SDKs internos sem forkar o braito; entradas do usuário são mescladas aos defaults embutidos; validadas pelo schema Zod
- **Keyword `"refactoring"` em decisões** — mensagens de commit como `"refactoring persistence layer to accept external IDs"` agora aparecem como evidência em `importantDecisions`
- **Evidência de co-change consolidada em `knownPitfalls`** — entradas por arquivo `"Co-changed Nx com X"` removidas de `knownPitfalls.evidence`; fica apenas uma linha de resumo e a lista detalhada permanece só em `impactValidation.evidence` — sem duplicação
- **Enriquecimento estático de notas** — `buildBasicNote` adiciona dicas de propósito (`"Has side effects (module-level execution)"`, `"Makes API calls: …"`) quando `purposeObserved` está esparso; melhora a densidade de sinal das notas puramente estáticas (abaixo do `llmThreshold`) sem exigir LLM
- **Log de custo/duração LLM** — `generate` registra custo total (USD), tempo LLM (segundos) e número de chamadas ao final da execução
- **Caminhos relativos nas notas** — `buildBasicNote` converte caminhos absolutos para relativos, tornando as notas portáveis e legíveis
- **Index usa purpose inferido** — coluna de resumo de propósito prefere descrições inferidas pelo LLM quando disponíveis
- **Dedup observed/inferred** — estratégia de merge filtra itens `inferred` do LLM que duplicam itens `observed`
- **Commits arriscados mantidos só como evidência** — não são mais promovidos a `knownPitfalls.observed`; mantidos em evidence para raciocínio do LLM
- **Diretiva de idioma reforçada** — system prompt sobrescreve preferências ambientes do provider (ex: memória do usuário no Claude CLI)

- **Agregados agora derivam do disco (fonte única de verdade)** — `index.json`, `search-index.json` e os metadados do `graph.json` são construídos a partir de `loadAllNotesFromDisk(root, outputDir)` depois do loop de síntese, e não mais de um `notes[]` em memória populado só pelos arquivos que o loop tocou; elimina a classe de bugs em que `--filter` / `--force` / runs cache-only encolhiam acidentalmente os artefatos do repo inteiro. Remove três workarounds adicionados antes; novo helper em `src/core/output/loadAllNotesFromDisk.ts` faz um walk com `fs.readdir` + `JSON.parse` paralelo (~50ms / 74 arquivos) e pula filenames agregados reservados

- **`purpose.observed`** — agora exibe assinaturas de função tipadas completas (`name(param: Tipo): ReturnType`) e a primeira linha do JSDoc, em vez de apenas listas de nomes de exports
- **Contexto do prompt LLM** — substituiu o truncamento nas primeiras 200 linhas pela extração de esqueleto semântico: exports + JSDoc + comentários especiais (DECISION/INVARIANT/WHY/HACK)
- **System prompt** — adicionados exemplos RUIM/BOM por campo para todos os seis campos da nota, evitando que o LLM produza resumos genéricos de listas de exports
- **Constituição do projeto** (`braito.context.md`) — arquivo opcional na raiz do projeto injetado em todo prompt de síntese LLM; permite que times definam vocabulário de domínio, restrições arquiteturais e áreas de risco
- **Slash commands para agentes** (`init --agent`) — gera `.claude/commands/braito-note.md`, `braito-impact.md`, `braito-search.md` no projeto alvo para que as ferramentas do braito fiquem disponíveis como slash commands nativos no Claude Code e Cursor
- **Site de docs migrado para Docusaurus** — reconstruído com Docusaurus v3, suporte completo a i18n (EN + PT-BR), homepage personalizada, modo escuro

---

### Fixed
- **`get_architecture_context` retornava campos vazios em `topCriticalFiles`** — o handler resolvia os notes por arquivo a partir de `entry.filePath` (absoluto), então `path.resolve` colapsava para o caminho do código-fonte, todo read dava ENOENT e o catch silencioso devolvia `{}`; agora usa `entry.relativePath`, adiciona guard de path traversal e mergeia `observed + inferred` para que os campos sintetizados pelo LLM (purpose/invariants/pitfalls) apareçam de fato
- **`--force` zerava o cache para arquivos fora do `--filter`** — `runGenerate` inicializava `noteHashStore` e `analysisStore` como Maps vazios quando `--force` estava ativo; combinado com `--filter`, só o arquivo casado era re-cacheado e todos os outros entries eram perdidos no save, forçando uma re-síntese LLM completa no próximo run; ambos os stores agora carregam do disco incondicionalmente e o `--force` é aplicado dentro do loop
- **Rerun com `--filter` reduzia index/search-index/graph apenas aos arquivos filtrados** — mesma causa do bug cache-only: o índice era reconstruído só com os arquivos do filtro, descartando os metadados dos demais; `runGenerate` agora recarrega do disco os notes das análises fora do filtro e os injeta em `notes[]` antes de reconstruir index/search/graph
- **Síntese do `claude-cli` falhava silenciosamente quando o modelo adicionava prosa** — respostas como `"Looking at this file...\n\n{...}"` ou `"Now let me analyze..."` disparavam `JSON Parse error` e caíam no fallback estático, perdendo a síntese LLM exatamente nos arquivos mais críticos; novo parser tolerante percorre todos os `{` candidatos até um deles fazer parse, system prompt reforçado com diretiva JSON-only explícita, testes de regressão cobrem prefixo/sufixo de prosa, fences + prosa, chaves aninhadas e aspas escapadas
- **Run cache-only do `generate` zerava index/search-index/metadata do graph** — quando todos os arquivos vinham do cache, `index.json` e `search-index.json` eram reescritos vazios e `graph.json` perdia os metadados dos nós; ramo de cache-hit agora recarrega o note `.json` existente do disco e o injeta no build do índice
- **`withDefaults` descartava config `llm`** — configuração LLM era silenciosamente descartada, causando modo static-only; agora passada corretamente
- **Schema de evidência LLM rígido demais** — valores de `type` desconhecidos retornados pelo LLM (ex: `'import'`, `'external'`) agora são coergidos para `'code'` via `.catch('code')` em vez de falhar a validação Zod e cair silenciosamente no fallback estático
- **Campo `signatures` ausente nos analisadores Python/Go** — prompts LLM não mostram mais "nenhuma extraída" para arquivos Python/Go
- **Caminhos absolutos no Impact Validation** — arquivos co-modificados agora usam caminhos relativos consistentemente

### Removed
- **Ferramenta MCP `get_overview`** — removida ferramenta órfã; `get_architecture_context` oferece funcionalidade equivalente e mais rica

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
