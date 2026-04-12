# Estudo Final: braito como Harness Engineering Platform

## Sumario Executivo

Este documento consolida tres camadas de analise:

1. **CLOUDE_GPT original** — comparacao tecnica braito vs NebulaSpecKit (metricas, health status, quality checklist)
2. **SPEC_GPT** — visao de governance-aware analysis (document intelligence, task intelligence, workflow recommendation)
3. **Harness Engineering (OpenAI Codex)** — filosofia de "humanos projetam ambientes, agentes executam"

A conclusao final: o braito ja e, estruturalmente, uma **Harness Engineering tool**. Ele gera conhecimento estruturado que agentes consomem via MCP, usa analise deterministica antes do LLM, e injeta contexto rico nos prompts. O que falta e fechar o ciclo: adicionar **enforcement**, **health tracking temporal**, **geracao de instrucoes para agentes** e **deteccao de divergencias**.

**Nova identidade:** braito = Harness Engineering platform for AI-driven codebases. Contexto operacional + governanca assistida + enforcement por convencao.

---

## 1. O que e Harness Engineering

O artigo da OpenAI ("Leveraging Codex in an agent-centric world", fev 2026) define Harness Engineering como a pratica de construir infraestrutura ao redor de agentes de codigo para que eles sejam eficazes, confiaveis e seguros.

### Principios centrais

1. **Humanos projetam ambientes, agentes executam codigo** — o papel do engenheiro muda de "escrever codigo" para "projetar sistemas que permitem agentes trabalhar bem"
2. **O repositorio e a unica fonte de verdade** — tudo que o agente nao consegue ver no repo, nao existe
3. **AGENTS.md como indice, nao enciclopedia** — contexto progressivo em vez de manual monolitico
4. **Linters como guardioes de arquitetura** — invariantes sao impostos mecanicamente, nao por convencao social
5. **Knowledge base versionada no repo** — docs/, design-docs/, exec-plans/, quality scores
6. **Legibilidade do agente e o objetivo** — o codigo e otimizado para o agente entender, nao so para humanos
7. **Quality scoring por dominio** — cada area do produto tem uma nota de qualidade rastreada ao longo do tempo
8. **Entropia e garbage collection** — agentes recorrentes limpam drift, refatoram, atualizam docs
9. **Feedback loops incrementais** — watch modes, caching, CI que mantem conhecimento fresco
10. **Autonomia crescente** — agentes comecam com tarefas simples e ganham capacidades ao longo do tempo

### Fluxo de trabalho do Codex

```
Humano descreve tarefa
  -> Codex executa
  -> Codex abre PR
  -> Codex revisa a propria PR (+ agentes revisores)
  -> Codex responde a feedback
  -> Codex itera ate revisores aprovarem
  -> Codex faz merge
```

---

## 2. O que o braito JA FAZ que e Harness Engineering

O braito nao precisa "virar" uma harness engineering tool — ele ja e uma em grande medida. A tabela abaixo mapeia cada pilar do artigo da OpenAI para o que ja existe no braito.

| Pilar do Harness Engineering | braito hoje | Arquivo-chave |
|---|---|---|
| **Agent instruction files** | `CLAUDE.md` com ~300 linhas bilingual, pipeline, modelo de dominio, convencoes, regras | `CLAUDE.md` |
| **Context injection no LLM** | `braito.context.md` carregado via `loadProjectContext()` e injetado em todo prompt | `src/core/config/loadProjectContext.ts` |
| **Agent-queryable knowledge (MCP)** | 8 tools via JSON-RPC 2.0: `get_file_note`, `get_impact`, `get_architecture_context`, `search`, `get_domain`, `search_by_criticality`, `get_business_rules`, etc. | `src/cli/commands/mcp.ts` |
| **Deterministic-first analysis** | Pipeline inteiro e deterministic; LLM so na borda de sintese, so para files com criticalityScore >= threshold | `src/core/output/buildBasicNote.ts` |
| **observed/inferred split** | Separacao inviolavel: observed vem do pipeline estatico, inferred vem do LLM, merge nunca sobrescreve observed | `src/core/llm/synthesizeFileNote.ts` |
| **Dependency graph as knowledge** | Forward + reverse graphs, cycle detection, persisted como `graph.json` | `src/core/graph/` |
| **Quality scoring** | `criticalityScore` (0-1) baseado em reverse deps, hooks, env vars, churn, coverage, authors | `src/core/output/buildBasicNote.ts` |
| **Incremental feedback loops** | Watch mode com debounce 300ms, SHA-1 cache, analysis cache, stale detection, CI workflow | `src/cli/commands/watch.ts`, `src/core/cache/` |
| **Knowledge base versionada** | `docs/` com ARCHITECTURE.md, DOMAIN_MODEL_AND_SCHEMA.md, LLM_STRATEGY.md, etc. + `docs-site/` completo | `docs/` |
| **Agent slash commands** | `init --agent` gera `.claude/commands/` com braito-note, braito-impact, braito-search | `src/cli/commands/init.ts` |
| **Evidence-backed claims** | Cada item em cada nota tem `EvidenceItem[]` tipado (code, git, test, graph, comment, doc) | `src/core/types/ai-note.ts` |
| **Business rules extraction** | Regex heuristics para numeric limits, permission guards, schema validations, business constants | `src/core/business/extractBusinessRules.ts` |
| **Diff mode para review** | `generate --diff` computa field-level diffs entre notas antigas e novas | `src/core/output/diffNotes.ts` |
| **Multi-language AST** | Python, Go analyzers alem do TS/JS primario | `src/core/ast/analyzers/` |
| **Web UI com transparencia** | Debug tab com score breakdown signal-by-signal, evidence trails | `src/cli/commands/ui.ts` |

**Avaliacao:** braito cobre ~70% dos pilares de Harness Engineering. O que ele faz, faz bem — especialmente MCP, deterministic-first analysis, e evidence-backed notes. Esses sao diferenciais que nem o Codex da OpenAI tem no mesmo nivel de granularidade.

---

## 3. O que FALTA para ser uma Harness Engineering Platform completa

### 3.1 Enforcement (Gap Alto)

**O que o artigo da OpenAI faz:** Linters customizados que impoem invariantes de arquitetura. Testes estruturais que validam direcao de dependencia entre camadas. Mensagens de erro de lint que injetam instrucoes de correcao no contexto do agente.

**O que o braito faz:** Zero enforcement. O braito observa e reporta, mas nao impoe nada. Nao ha linters customizados, nao ha testes de arquitetura, nao ha pre-commit hooks.

**O que precisa existir:**

```
src/core/enforcement/
  architectureRules.ts      — Regras de fronteira entre camadas (CLI nao importa de graph/)
  dependencyBoundaries.ts   — Direcao de dependencia permitida por dominio
  structuralTests.ts        — Testes que validam invariantes de arquitetura
  generateLintRules.ts      — Gera regras de lint a partir do dependency graph

.braito/
  boundaries.json           — Regras de fronteira configuradas pelo usuario
  enforcement-report.json   — Resultado da ultima validacao
```

**MCP tool novo:** `check_architecture_compliance` — verifica se uma mudanca respeita as fronteiras de dominio.

### 3.2 Health Tracking Temporal (Gap Alto)

**O que o artigo da OpenAI faz:** Quality score por dominio rastreado ao longo do tempo. Agentes recorrentes verificam drift e abrem PRs de refatoracao.

**O que o braito faz:** Point-in-time snapshots. O `criticalityScore` e calculado a cada `generate`, mas sem historico. Nao ha como saber se um arquivo esta melhorando ou piorando.

**O que precisa existir:**

```
.ai-notes/
  history.json              — Array de snapshots timestamped com scores por arquivo
  trends.json               — Tendencias calculadas (media movel, direcao, alertas)
```

**Mudancas no pipeline:**
- `generate` appenda um entry em `history.json` a cada run
- `buildIndex` inclui `trend: 'improving' | 'stable' | 'degrading'` por arquivo
- `index.md` mostra indicadores de tendencia

**MCP tools novos:**
- `get_health_trends` — tendencias de score por arquivo ou dominio
- `get_degrading_files` — arquivos cuja saude esta piorando

### 3.3 AGENTS.md Generation for Target Projects (Gap Medio)

**O que o artigo da OpenAI faz:** AGENTS.md como indice (~100 linhas) que aponta para fontes de conhecimento mais profundas em docs/.

**O que o braito faz:** `init --agent` gera slash commands para Claude Code. Nao gera AGENTS.md, .codex, .cursorrules ou instrucoes genéricas para agentes.

**O que precisa existir:**

Estender `init` com flag `--agents-md` que gera um AGENTS.md derivado da analise do braito:

```markdown
# AGENTS.md

## Critical Files (always check notes before editing)
- src/core/output/buildBasicNote.ts (score: 0.85, 12 consumers)
- src/core/graph/resolveImportPath.ts (score: 0.75, cycle participant)

## Domain Boundaries
- src/cli/ — orchestration only, no business logic
- src/core/ast/ — AST parsing, no IO
- src/core/llm/ — LLM synthesis edge, isolated providers

## Key Invariants
- observed/inferred split must never be collapsed
- LLM is optional; static pipeline must always produce useful output
- Evidence chain required for every claim

## Environment Variables
- ANTHROPIC_API_KEY, OPENAI_API_KEY (optional, for LLM synthesis)

## Circular Dependencies (handle with care)
- src/core/graph/resolveImportPath.ts <-> src/core/graph/loadBundlerAliases.ts

## How to Get Context
- Run: bun src/cli/index.ts mcp --root ./
- Use get_file_note before editing any file
- Use get_impact before refactoring
- Use get_architecture_context for orientation
```

Isso e **gerado automaticamente** a partir do `index.json`, `graph.json` e das notas. O AGENTS.md nunca fica desatualizado porque e regenerado a cada `generate`.

### 3.4 Structural Metrics (Gap Medio)

**O que o artigo da OpenAI faz:** Impoe limites de tamanho de arquivo, convencoes de naming, logging estruturado, requisitos de confiabilidade.

**O que o braito faz:** Conta imports, exports, hooks, env vars. Nao mede linhas por funcao, nesting depth, branches, parametros, complexidade ciclomatica.

**O que precisa existir:** `src/core/ast/extractMetrics.ts` (ja proposto nas fases 1-2 do CLOUDE_GPT anterior). O `ts-morph` ja esta no pipeline — basta contar nodes.

### 3.5 Governance Intelligence (Gap Medio-Alto)

**Ja proposto no SPEC_GPT e no CLOUDE_GPT cruzado.** Resume:
- `src/core/governance/` com detectGovernanceModel, loadGovernanceContext, parseTasks, suggestWorkflow, reviewReadiness, detectDivergence
- MCP tools: `get_file_governance`, `suggest_workflow`, `get_change_readiness`, `detect_divergences`

### 3.6 Divergence Detection (Gap Alto — diferencial unico)

**O que o artigo da OpenAI faz:** Agente recorrente verifica se documentacao esta desatualizada e abre PRs de correcao.

**O que o braito faz:** Nada. Mas tem todos os insumos: AST para codigo, leitura de docs para documentacao, graph para estrutura. Cruzar os dois e detectar inconsistencias e o alinhamento perfeito entre Harness Engineering e o DNA do braito.

**Exemplos de divergencias detectaveis:**
- `Docs/contract.yaml` define endpoint `/users` com campo `email: required`, mas `src/api/schemas/user.ts` aceita `email: string | null`
- `docs/ARCHITECTURE.md` diz "CLI nao tem business logic", mas `src/cli/commands/generate.ts` tem logica de scoring inline
- `Docs/structure.md` lista `src/core/cache/` com 2 arquivos, mas existem 4

---

## 4. Cruzamento: NebulaSpecKit + Harness Engineering + braito

### 4.1 Tabela de tres vias

| Conceito | NebulaSpecKit | Harness Eng (OpenAI) | braito (alvo) |
|---|---|---|---|
| **Fonte de verdade** | `Docs/` (manual) | Repo (code + docs + AGENTS.md) | `.ai-notes/` + `docs/` + AGENTS.md (gerado) |
| **Quem escreve** | Humano + IA governada | 100% agente, humano revisa | Pipeline deterministic + LLM na borda |
| **Enforcement** | Quality Gate (manual) | Linters + testes estruturais (automatico) | Quality checklist + enforcement rules (automatico) |
| **Qualidade** | 14 metricas com bandas | Quality score por dominio | criticalityScore + healthStatus + structuralMetrics |
| **Rastreabilidade** | Hash + task ID + quality gate | Planos de execucao versionados | Evidence chain tipada (code, git, test, graph, comment, doc) |
| **Agent interface** | Prompt template canonical | CLI tools + MCP | MCP server com 9+ tools |
| **Workflow** | 11 workflows tipados | Implicit (por tipo de PR) | suggestWorkflow() baseado em sinais |
| **Drift control** | Humano + checklist | Agentes recorrentes + golden principles | detectDivergence() + health trends |
| **Historico** | `Docs/control.md` | Planos completed/ | `history.json` (trend tracking) |
| **Bootstrap** | Templates em Templates/Full/ | Repo gerado do zero pelo agente | `init --governance` + `init --agents-md` |

### 4.2 O que vem de cada fonte

```
NebulaSpecKit contribui:
  ├── Metricas estruturais com bandas (14 nucleares)
  ├── Health status categorico (healthy/attention/limit/critical)
  ├── Quality checklist por arquivo
  ├── Governance intelligence (docs, tasks, workflows)
  ├── Divergence detection (docs vs codigo)
  └── init --governance (templates de bootstrap)

Harness Engineering contribui:
  ├── Enforcement automatico (linters, testes estruturais)
  ├── Health tracking temporal (trends, regression)
  ├── AGENTS.md generation (indice gerado da analise)
  ├── Golden principles codificados no repo
  ├── Agentes recorrentes de limpeza/drift
  └── Legibilidade do agente como metrica de design

braito ja tem:
  ├── Pipeline deterministic-first
  ├── observed/inferred split inviolavel
  ├── MCP server com 9 tools
  ├── Evidence chain tipada
  ├── Dependency graph + cycle detection
  ├── Watch mode incremental
  ├── Cache SHA-1 + analysis cache
  ├── Business rules extraction
  ├── Diff mode para review
  └── Web UI com debug transparency
```

---

## 5. Plano de Implementacao Final (6 fases)

### Fase 1: Structural Metrics + Health Status (1-2 semanas)

**O que:** Extrair metricas do AST, classificar saude, adicionar ao schema.

**Modulos novos:**
- `src/core/ast/extractMetrics.ts`
- `src/core/output/computeHealthStatus.ts`

**Schema:**
```ts
type StructuralMetrics = {
  linesPerFile: number
  maxLinesPerFunction: number
  avgLinesPerFunction: number
  maxParams: number
  maxNestingDepth: number
  maxBranchesPerFunction: number
  importsCount: number
  exportsCount: number
  functionsCount: number
}

type HealthStatus = 'healthy' | 'attention' | 'limit' | 'critical'
```

**Origem:** NebulaSpecKit (metricas com bandas) + Harness Eng (quality scoring por dominio)

### Fase 2: Quality Checklist + Enforcement Rules (1-2 semanas)

**O que:** Gerar checklist acionavel por arquivo + regras de enforcement basicas.

**Modulos novos:**
- `src/core/output/buildChecklist.ts`
- `src/core/enforcement/architectureRules.ts`
- `src/core/enforcement/dependencyBoundaries.ts`

**MCP tools novos:**
- `get_quality_assessment` — metricas + health + checklist de um arquivo
- `get_refactoring_targets` — arquivos com health `limit` ou `critical`
- `check_architecture_compliance` — verifica se paths respeitam fronteiras

**Config novo:**
```ts
quality?: {
  metrics?: Partial<MetricThresholds>
  checklist?: boolean
  warnOnMocks?: boolean
}
enforcement?: {
  boundaries?: Record<string, { allowedImports: string[]; blockedImports: string[] }>
  maxFileLines?: number
  maxFunctionLines?: number
}
```

**Origem:** NebulaSpecKit (checklist, anti-mock) + Harness Eng (linters, invariantes impostos)

### Fase 3: Health Tracking + AGENTS.md Generation (1-2 semanas)

**O que:** Historico temporal de scores + geracao automatica de AGENTS.md.

**Modulos novos:**
- `src/core/output/trackHistory.ts`
- `src/core/output/generateAgentsMd.ts`

**Saida nova:**
- `.ai-notes/history.json` — snapshots timestamped
- `.ai-notes/trends.json` — tendencias calculadas
- `AGENTS.md` (ou `.braito/AGENTS.md`) — gerado a cada `generate`

**MCP tools novos:**
- `get_health_trends` — tendencias por arquivo ou dominio
- `get_degrading_files` — arquivos em piora

**Extensao do `init`:**
- `init --agents-md` — gera AGENTS.md uma vez (sem precisar rodar generate)

**Origem:** Harness Eng (quality tracking temporal, AGENTS.md como indice, drift detection)

### Fase 4: Governance Intelligence (1-2 semanas)

**O que:** Ler artefatos de governanca, conectar codigo com docs oficiais.

**Modulos novos:**
- `src/core/governance/detectGovernanceModel.ts`
- `src/core/governance/loadGovernanceContext.ts`
- `src/core/governance/resolveSourceOfTruth.ts`
- `src/core/governance/suggestWorkflow.ts`
- `src/core/governance/reviewReadiness.ts`

**MCP tools novos:**
- `get_file_governance` — documento que governa uma area, tasks, contratos
- `suggest_workflow` — workflow recomendado + docs obrigatorios
- `get_change_readiness` — prontidao de mudanca (evidencias presentes e faltantes)

**Origem:** NebulaSpecKit (governance por docs) + SPEC_GPT (document intelligence, task intelligence)

### Fase 5: Divergence Detection (1-2 semanas)

**O que:** Detectar inconsistencias entre documentacao e implementacao.

**Modulos novos:**
- `src/core/governance/detectDivergence.ts`

**MCP tool novo:**
- `detect_divergences` — inconsistencias por dominio ou arquivo

**Exemplos:**
- Contrato YAML define campo obrigatorio, implementacao aceita null
- Architecture doc diz "camada X nao depende de Y", graph mostra que depende
- Structure doc lista N arquivos, realidade tem M

**Origem:** Harness Eng (agentes recorrentes validam docs) + DNA do braito (analise deterministica cruza com docs)

### Fase 6: init --governance + Spec Mode (1-2 semanas)

**O que:** Bootstrap de estrutura documental + templates com identidade braito.

**Extensao do `init`:**
- `init --governance` gera `Docs/`, `Quality/`, `Workflows/` com templates braito

**Origem:** NebulaSpecKit (templates) + SPEC_GPT (spec mode)

---

## 6. Mapeamento Harness Engineering -> braito

Para referencia direta, o mapeamento conceito-por-conceito entre o artigo da OpenAI e o braito:

| Conceito OpenAI | Implementacao no braito |
|---|---|
| "AGENTS.md como indice" | `init --agents-md` gera AGENTS.md a partir de index.json + graph.json + notas |
| "docs/ como base de conhecimento" | braito ja gera `.ai-notes/` com JSON + MD + index + graph; adicionar governance gera `Docs/` |
| "Linters customizados com mensagens que ensinam o agente" | `enforcement/architectureRules.ts` gera violations com `message` + `fix_suggestion` |
| "Quality score por dominio" | `index.json` ja agrupa por dominio com `avgCriticality`; adicionar `healthStatus` e `trends` |
| "Testes estruturais" | `enforcement/structuralTests.ts` valida invariantes de arquitetura |
| "Feedback loops incrementais" | Watch mode + SHA-1 cache + analysis cache + CI + stale detection |
| "Legibilidade do agente" | MCP server com 9+ tools; `braito.context.md`; slash commands; AGENTS.md gerado |
| "Entropia e garbage collection" | `detect_divergences` + `get_degrading_files` + health trends |
| "Autonomia crescente" | braito como MCP server -> agentes consomem contexto -> tomam decisoes informadas |
| "Deterministic analysis before LLM" | Pipeline inteiro e deterministic; LLM so para files com criticalityScore >= threshold |
| "Parse at the boundary" | `buildBasicNote` e `extractBusinessRules` extraem constraints de forma deterministica |
| "Knowledge that agents can't see doesn't exist" | Tudo que braito sabe fica em `.ai-notes/` — versionado, local, acessivel via MCP |
| "Planos de execucao versionados" | `history.json` + `trends.json` para tracking; governance `Docs/tasks.md` para planos |

---

## 7. Pros e Contras Finais

### Pros

1. **braito ja tem ~70% da base** — nao e uma reinvencao, e uma evolucao natural
2. **Posicionamento unico no mercado** — nenhuma ferramenta combina analise deterministic + evidence chain + MCP + governance + enforcement + health tracking
3. **Cada fase entrega valor isoladamente** — o usuario pode parar em qualquer fase e ter uma ferramenta util
4. **Alinhamento com tendencia da industria** — Harness Engineering e o futuro do desenvolvimento com agentes (OpenAI, Anthropic, Cursor todos investem nisso)
5. **DNA preservado** — observed/inferred, LLM-at-the-edge, deterministic-first intocados
6. **MCP como superficie unificada** — agentes nao precisam aprender N ferramentas, tudo via MCP
7. **Geracao automatica de AGENTS.md** — o conhecimento nunca fica desatualizado porque e gerado do pipeline
8. **Divergence detection e killer feature** — cruzar docs com analise deterministica e algo que ninguem faz

### Contras

1. **Escopo total (6 fases) e ambicioso** — ~8-12 semanas de trabalho
2. **Enforcement e opinativo** — pode irritar usuarios que nao querem regras
3. **Historico temporal consome espaco** — `history.json` cresce a cada run
4. **Governance depende de convencoes** — parsing de Markdown livre e fragil
5. **15+ MCP tools pode sobrecarregar contexto** — agentes tem limite de contexto
6. **Complexidade do schema cresce** — 4 campos opcionais novos no AiFileNote
7. **Manutencao de templates** — `init --governance` gera 12+ arquivos

### Mitigacoes

| Contra | Mitigacao |
|---|---|
| Escopo ambicioso | MVP = Fases 1-3 (~5 semanas). Ja entrega metricas, checklist, enforcement, health trends, AGENTS.md |
| Enforcement opinativo | Tudo opt-in via `enforcement` no config. Default: off |
| Historico consome espaco | Retention policy configuravel (default: 90 dias). Compactacao automatica |
| Governance fragil | Deteccao graceful: Markdown mal formatado = skip, nao crash |
| MCP tools demais | Agrupamento por categoria (`quality.*`, `governance.*`, `enforcement.*`). Agentes filtram por prefixo |
| Schema complexo | Todos os campos novos sao `optional`. Backward compatible. Schema version bump |
| Templates | Versionados com schema version. Regeneraveis a qualquer momento |

---

## 8. Conclusao

O artigo da OpenAI sobre Harness Engineering valida a direcao que o braito ja seguia — analise deterministica, contexto estruturado para agentes, MCP como superficie de consulta. A diferenca e que o braito parou na camada de **observacao** e nao avancou para **enforcement** e **tracking temporal**.

O cruzamento das tres fontes (NebulaSpecKit + Harness Eng + braito atual) produz uma visao clara:

```
braito atual               braito alvo
┌────────────────────┐     ┌────────────────────────────────┐
│ Observa            │     │ Observa                        │
│ - AST, graph, git  │     │ - AST, graph, git, metrics     │
│ - tests, coverage  │     │ - tests, coverage, governance  │
│ - business rules   │     │ - business rules               │
│                    │     │                                │
│ Sintetiza          │     │ Classifica                     │
│ - notas por arquivo│     │ - health status                │
│ - indice           │     │ - quality checklist            │
│ - LLM na borda     │     │ - tendencias temporais         │
│                    │     │                                │
│ Expoe              │     │ Impoe (opt-in)                 │
│ - MCP (9 tools)    │     │ - architecture boundaries      │
│ - Web UI           │     │ - structural rules             │
│ - Sidecars         │     │ - divergence alerts            │
│                    │     │                                │
│                    │     │ Gera                           │
│                    │     │ - AGENTS.md automatico         │
│                    │     │ - governance templates         │
│                    │     │ - MCP (15+ tools)              │
│                    │     │ - Web UI + sidecars            │
│                    │     │                                │
│                    │     │ Sintetiza                      │
│                    │     │ - notas enriquecidas           │
│                    │     │ - LLM na borda (preservado)    │
└────────────────────┘     └────────────────────────────────┘
```

O braito esta a 6 fases de ser a Harness Engineering platform mais completa do mercado para projetos que usam agentes AI. A base tecnica ja e solida — o que falta e fechar o ciclo de observacao -> classificacao -> enforcement -> geracao -> tracking.

---

## 9. Referencia: Artigo OpenAI

**Titulo:** "Leveraging Codex in an agent-centric world"
**Autor:** Ryan Lopopolo, OpenAI
**Data:** 11 de fevereiro de 2026
**URL:** https://openai.com/index/harness-engineering/

**Numeros citados:**
- ~1 milhao de linhas de codigo, 0 linhas escritas manualmente
- ~1500 PRs merged em 5 meses
- 3.5 PRs/engenheiro/dia (media)
- 3 engenheiros iniciais, escalou para 7
- Estimativa: 1/10 do tempo vs codigo manual
- Codex executa tarefas de 6+ horas autonomamente
