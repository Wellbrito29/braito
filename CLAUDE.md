# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## English

### Project Overview

**braito** (AI File Notes) is a TypeScript CLI tool that analyzes codebases and generates operational knowledge sidecars (`.json` + `.md`) per file. It targets dense TypeScript/JavaScript monorepos and teams using AI for code review, onboarding, and maintenance.

**All phases are implemented, including Phase 5.** The tool is fully operational.

### CLI Commands

```bash
bun install                                                        # install dependencies
bun src/cli/index.ts scan --root ./                                # discover and list eligible files
bun src/cli/index.ts scan --root ./ --format json                  # machine-readable output
bun src/cli/index.ts generate --root ./                            # full pipeline — writes .ai-notes/
bun src/cli/index.ts generate --root ./ --force                    # bypass cache, reprocess all files
bun src/cli/index.ts generate --root ./ --filter src/core/**       # scope to subdirectory
bun src/cli/index.ts generate --root ./ --diff                     # show field-level diff
bun src/cli/index.ts generate --root ./ --dry-run                  # preview without writing
bun src/cli/index.ts watch --root ./                               # watch mode — regenerates on file change
bun src/cli/index.ts mcp --root ./                                 # MCP server (JSON-RPC 2.0 over stdio)
bun src/cli/index.ts mcp --root ./ --auto-generate                 # generate notes if missing, then start MCP
bun src/cli/index.ts ui --root ./                                  # local web UI at http://localhost:7842
bun test                                                           # run all test suites
```

### Architecture

The pipeline flows linearly:

```
repo → scanner → static analyzer → graph engine → git intelligence
     → [cache check] → static note → [LLM synthesis] → write .json + .md + index
```

**Key constraint:** LLM sits at the synthesis edge only. The majority of the pipeline is deterministic and auditable. Files are only sent to LLM when `criticalityScore >= llmThreshold` (default `0.4`).

#### Layer breakdown

| Layer | Path | Responsibility |
|---|---|---|
| CLI | `src/cli/` | Command orchestration — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Core | `src/core/` | All business logic |
| Output | `src/core/output/` | JSON/Markdown serialization, sidecar writing, index building |
| Cache | `src/core/cache/` | SHA-1 hash per file, skip unchanged files, stale detection |

#### Core modules

- **`core/scanner/`** — file discovery with `Bun.Glob`, include/exclude/ignore rules
- **`core/ast/`** — `ts-morph` for TS/JS; `LanguageAnalyzer` interface + registry; Python and Go analyzers; extractors for imports, exports, symbols, hooks, comments, env vars, API calls
- **`core/graph/`** — direct + reverse dependency graphs; cycle detection; `resolveImportPath` handles relative paths, `tsconfig.paths` aliases, and bundler aliases (Vite, Webpack, Metro)
- **`core/git/`** — churn score, recent commit messages, co-changed files, author count via `git` CLI + `Bun.spawnSync`
- **`core/tests/`** — heuristic test discovery; `loadCoverage` reads `lcov.info` or `coverage-summary.json`
- **`core/cache/`** — SHA-1 hash per file, `cache/hashes.json`, skip unchanged files; `isNoteStale` flags notes older than `staleThresholdDays` (default 30)
- **`core/llm/`** — provider abstraction (`ollama`, `anthropic`, `openai`), retry/timeout, prompt builder, Zod schema validation, merge strategy
- **`core/output/`** — `buildBasicNote`, `writeJsonNote`, `writeMarkdownNote`, `buildIndex` (domain-grouped with dependents), `writeIndexNote`

### Domain Model

```ts
type AiFileNote = {
  filePath: string
  purpose: StructuredListField
  invariants: StructuredListField
  sensitiveDependencies: StructuredListField
  importantDecisions: StructuredListField
  knownPitfalls: StructuredListField
  impactValidation: StructuredListField
  criticalityScore: number   // 0–1, heuristic based on consumers, churn, hooks, tests
  generatedAt: string
  model: string              // "static" | "<llm-model-name>"
}

type StructuredListField = {
  observed: string[]         // facts from static analysis / git / tests
  inferred: string[]         // LLM synthesis (empty when model = "static")
  confidence: number         // 0–1
  evidence: EvidenceItem[]   // type: 'code' | 'git' | 'test' | 'graph' | 'comment' | 'doc'
}
```

The `observed`/`inferred` split is mandatory — never collapse them.

### LLM Configuration

Configure in `ai-notes.config.ts`. Provider is dynamic — swap without changing the pipeline.

```ts
// Ollama (local, no API key needed)
llm: { provider: 'ollama', model: 'llama3', llmThreshold: 0.4, temperature: 0.2 }

// Anthropic — set ANTHROPIC_API_KEY env var
llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4 }

// OpenAI — set OPENAI_API_KEY env var
llm: { provider: 'openai', model: 'gpt-4o', llmThreshold: 0.4 }
```

**Security:** API keys must be set via environment variables only — never in `ai-notes.config.ts`.

### Generated Output

- `.ai-notes/<relative-path>.json` — structured note per file
- `.ai-notes/<relative-path>.md` — human-readable sidecar
- `.ai-notes/index.json` — all files ranked by criticality, with domain, dependents, and stale flags
- `.ai-notes/index.md` — grouped by domain, avg score per group, stale marker ⚠
- `cache/hashes.json` — SHA-1 per file for incremental runs

Do not edit `.ai-notes/` or `cache/` manually.

### MCP Server

Exposes braito notes as tools for AI assistants (Cursor, Claude Code, custom agents):

```bash
bun src/cli/index.ts mcp --root ./
```

Tools: `get_file_note`, `search_by_criticality`, `get_index`, `get_architecture_context`, `get_impact`, `search`, `get_domain`.

### CI

`.github/workflows/ai-notes.yml` triggers on push to `main`/`master` when source files change. Requires full git history (`fetch-depth: 0`) for accurate git signals. Supports `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` as repository secrets.

### Project Tracking

- **`TODO.md`** — pending next steps, grouped by short/medium/long-term
- **`CHANGELOG.md`** — record of all completed work

### Changelog Rule

**Every time a feature, fix, or improvement is completed, update `CHANGELOG.md` immediately.**

- Add the entry under `[Unreleased]` with the appropriate category (`Added`, `Changed`, `Fixed`, `Removed`)
- When a TODO item is completed, check it off in `TODO.md` and add the corresponding entry to `CHANGELOG.md`
- Use the format: `- **Feature name** — brief description of what was done`

### README Rule

**When a new command, feature, or configuration option is added, update `README.md` to reflect it.**

- Keep the CLI commands section, architecture table, and configuration examples in sync with the actual implementation
- Do not let the README describe a subset of what the tool can do
- README must always be bilingual (English + Portuguese)

### Docs Site Rule

**When a new feature, command, or configuration option is added, update the GitHub Pages documentation site (`docs-site/`) to reflect it.**

- The relevant page in `docs-site/guide/` or `docs-site/reference/` must be updated in both English and Portuguese (`docs-site/pt/`)
- If a new concept is large enough to warrant its own page, create it and add it to the sidebar in `docs-site/.vitepress/config.ts`
- Keep `docs-site/changelog.md` and `docs-site/pt/changelog.md` in sync with `CHANGELOG.md` — add the new entry under `[Unreleased]` in both languages
- Do not let the docs site describe a subset of what the tool can do

### Git Conventions

**Never include any reference to the AI assistant in commits, branches, or code.**

- Do not use "claude", "Claude", "AI", "anthropic", or any AI assistant identifier in commit messages
- Do not prefix branch names with `claude/` — use descriptive names based on the feature or fix (e.g. `feat/alias-resolution`, `fix/incremental-graph`)
- Commit messages must reflect the work done, not who or what did it
- Do not add "Generated by Claude" or similar footers to commit messages
- The sole author of all commits is the repository owner — never set `GIT_AUTHOR_NAME` or `GIT_COMMITTER_NAME` to anything other than the owner's identity
- Git user identity must always be `Wellington Nascimento <well334@hotmail.com>`

---

## Português

### Visão Geral do Projeto

**braito** (AI File Notes) é uma CLI TypeScript que analisa repositórios e gera sidecars de conhecimento operacional (`.json` + `.md`) por arquivo. Voltado para monorepos densos em TypeScript/JavaScript e equipes que usam IA para revisão de código, onboarding e manutenção.

**Todas as fases estão implementadas, incluindo a Fase 5.** A ferramenta está totalmente operacional.

### Comandos CLI

```bash
bun install                                                        # instalar dependências
bun src/cli/index.ts scan --root ./                                # descobrir arquivos elegíveis
bun src/cli/index.ts scan --root ./ --format json                  # saída legível por máquina
bun src/cli/index.ts generate --root ./                            # pipeline completo — grava .ai-notes/
bun src/cli/index.ts generate --root ./ --force                    # ignorar cache, reprocessar tudo
bun src/cli/index.ts generate --root ./ --filter src/core/**       # escopo para subdiretório
bun src/cli/index.ts generate --root ./ --diff                     # mostrar diferença campo a campo
bun src/cli/index.ts generate --root ./ --dry-run                  # visualizar sem gravar arquivos
bun src/cli/index.ts watch --root ./                               # watch mode — regenera ao detectar mudanças
bun src/cli/index.ts mcp --root ./                                 # servidor MCP (JSON-RPC 2.0 via stdio)
bun src/cli/index.ts mcp --root ./ --auto-generate                 # gera notas se não existirem e inicia MCP
bun src/cli/index.ts ui --root ./                                  # interface web local em http://localhost:7842
bun test                                                           # executar todos os testes
```

### Arquitetura

O pipeline flui linearmente:

```
repo → scanner → analisador estático → grafo de dependências → sinais do git
     → [verificação de cache] → nota estática → [síntese LLM] → grava .json + .md + index
```

**Restrição principal:** o LLM fica apenas na borda de síntese. A maior parte do pipeline é determinística e auditável. Arquivos só são enviados ao LLM quando `criticalityScore >= llmThreshold` (padrão `0.4`).

#### Camadas

| Camada | Caminho | Responsabilidade |
|---|---|---|
| CLI | `src/cli/` | Orquestração dos comandos — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Core | `src/core/` | Toda a lógica de negócio |
| Output | `src/core/output/` | Serialização JSON/Markdown, escrita de sidecars, construção do índice |
| Cache | `src/core/cache/` | SHA-1 por arquivo, pular arquivos inalterados, detecção de notas antigas |

#### Módulos principais

- **`core/scanner/`** — descoberta de arquivos com `Bun.Glob`, regras de include/exclude
- **`core/ast/`** — `ts-morph` para TS/JS; interface `LanguageAnalyzer` + registry; analisadores Python e Go; extratores para imports, exports, símbolos, hooks, comentários, variáveis de ambiente, chamadas de API
- **`core/graph/`** — grafos de dependência diretos e reversos; detecção de ciclos; `resolveImportPath` trata caminhos relativos, aliases de `tsconfig.paths` e aliases de bundlers (Vite, Webpack, Metro)
- **`core/git/`** — score de churn, commits recentes, co-mudanças, contagem de autores via `git` CLI + `Bun.spawnSync`
- **`core/tests/`** — descoberta heurística de testes; `loadCoverage` lê `lcov.info` ou `coverage-summary.json`
- **`core/cache/`** — SHA-1 por arquivo, `cache/hashes.json`, pular arquivos inalterados; `isNoteStale` marca notas mais antigas que `staleThresholdDays` (padrão 30)
- **`core/llm/`** — abstração de providers (`ollama`, `anthropic`, `openai`), retry/timeout, prompt builder, validação Zod, estratégia de merge
- **`core/output/`** — `buildBasicNote`, `writeJsonNote`, `writeMarkdownNote`, `buildIndex` (agrupado por domínio com dependents), `writeIndexNote`

### Modelo de Domínio

```ts
type AiFileNote = {
  filePath: string
  purpose: StructuredListField
  invariants: StructuredListField
  sensitiveDependencies: StructuredListField
  importantDecisions: StructuredListField
  knownPitfalls: StructuredListField
  impactValidation: StructuredListField
  criticalityScore: number   // 0–1, heurística baseada em consumidores, churn, hooks, testes
  generatedAt: string
  model: string              // "static" | "<nome-do-modelo-llm>"
}

type StructuredListField = {
  observed: string[]         // fatos da análise estática / git / testes
  inferred: string[]         // síntese LLM (vazio quando model = "static")
  confidence: number         // 0–1
  evidence: EvidenceItem[]   // tipo: 'code' | 'git' | 'test' | 'graph' | 'comment' | 'doc'
}
```

A separação `observed`/`inferred` é obrigatória — nunca colapse os dois.

### Configuração do LLM

Configure em `ai-notes.config.ts`. O provider é dinâmico — troque sem alterar o pipeline.

```ts
// Ollama (local, sem chave de API)
llm: { provider: 'ollama', model: 'llama3', llmThreshold: 0.4, temperature: 0.2 }

// Anthropic — defina a variável ANTHROPIC_API_KEY
llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4 }

// OpenAI — defina a variável OPENAI_API_KEY
llm: { provider: 'openai', model: 'gpt-4o', llmThreshold: 0.4 }
```

**Segurança:** chaves de API devem ser definidas apenas por variáveis de ambiente — nunca no `ai-notes.config.ts`.

### Saída Gerada

- `.ai-notes/<caminho-relativo>.json` — nota estruturada por arquivo
- `.ai-notes/<caminho-relativo>.md` — sidecar legível por humanos
- `.ai-notes/index.json` — todos os arquivos ranqueados por criticidade, com domínio, dependents e flags de stale
- `.ai-notes/index.md` — agrupado por domínio, score médio por grupo, marcador ⚠ para notas antigas
- `cache/hashes.json` — SHA-1 por arquivo para execuções incrementais

Não edite `.ai-notes/` ou `cache/` manualmente.

### Servidor MCP

Expõe as notas do braito como ferramentas para assistentes de IA (Cursor, Claude Code, agentes customizados):

```bash
bun src/cli/index.ts mcp --root ./
```

Ferramentas: `get_file_note`, `search_by_criticality`, `get_index`, `get_architecture_context`, `get_impact`, `search`, `get_domain`.

### CI

`.github/workflows/ai-notes.yml` é acionado em push para `main`/`master` quando arquivos fonte mudam. Requer histórico git completo (`fetch-depth: 0`) para sinais precisos. Suporta `ANTHROPIC_API_KEY` e `OPENAI_API_KEY` como secrets do repositório.

### Rastreamento do Projeto

- **`TODO.md`** — próximos passos pendentes, agrupados por curto/médio/longo prazo
- **`CHANGELOG.md`** — registro de todo trabalho concluído

### Regra do Changelog

**Toda vez que uma feature, correção ou melhoria for concluída, atualize o `CHANGELOG.md` imediatamente.**

- Adicione a entrada em `[Unreleased]` com a categoria adequada (`Added`, `Changed`, `Fixed`, `Removed`)
- Quando um item do TODO for concluído, marque-o no `TODO.md` e adicione a entrada correspondente no `CHANGELOG.md`
- Use o formato: `- **Nome da feature** — breve descrição do que foi feito`

### Regra do README

**Quando um novo comando, feature ou opção de configuração for adicionado, atualize o `README.md` para refletir isso.**

- Mantenha a seção de comandos CLI, tabela de arquitetura e exemplos de configuração sincronizados com a implementação real
- Não deixe o README descrever apenas um subconjunto do que a ferramenta faz
- O README deve sempre ser bilíngue (inglês + português)

### Regra do Site de Docs

**Quando uma nova feature, comando ou opção de configuração for adicionada, atualize o site GitHub Pages (`docs-site/`) para refletir isso.**

- A página relevante em `docs-site/guide/` ou `docs-site/reference/` deve ser atualizada em inglês e português (`docs-site/pt/`)
- Se o conceito for grande o suficiente, crie uma página nova e adicione na sidebar em `docs-site/.vitepress/config.ts`
- Mantenha `docs-site/changelog.md` e `docs-site/pt/changelog.md` sincronizados com `CHANGELOG.md` — adicione a nova entrada em `[Unreleased]` em ambos os idiomas
- Não deixe o site de docs descrever apenas um subconjunto do que a ferramenta faz

### Convenções de Git

**Nunca inclua qualquer referência ao assistente de IA em commits, branches ou código.**

- Não use "claude", "Claude", "AI", "anthropic" ou qualquer identificador de assistente de IA em mensagens de commit
- Não prefixe nomes de branch com `claude/` — use nomes descritivos baseados na feature ou correção (ex: `feat/alias-resolution`, `fix/incremental-graph`)
- As mensagens de commit devem refletir o trabalho realizado, não quem ou o que o fez
- Não adicione rodapés como "Generated by Claude" nas mensagens de commit
- O único autor de todos os commits é o dono do repositório — nunca defina `GIT_AUTHOR_NAME` ou `GIT_COMMITTER_NAME` com outra identidade
- A identidade git deve sempre ser `Wellington Nascimento <well334@hotmail.com>`
