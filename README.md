<p align="center">
  <img src="docs/assets/braito.png" alt="Braito — Operational context for codebases" width="600" />
</p>

<p align="center">
  <strong>Operational context for codebases.</strong><br/>
  Braito analyzes TypeScript/JavaScript repos and generates structured knowledge sidecars per file — powered by static analysis, git intelligence, and optional LLM synthesis.
</p>

<p align="center">
  <img alt="Built with Bun" src="https://img.shields.io/badge/built%20with-Bun-f9f1e1?logo=bun&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white" />
  <img alt="Status" src="https://img.shields.io/badge/status-operational-brightgreen" />
</p>

<p align="center">
  <a href="#english">English</a> · <a href="#português">Português</a>
</p>

---

## English

### What it does

Braito scans your codebase and generates a `.ai-notes/` directory with one `.json` + `.md` sidecar per file. Each note contains:

| Field | Description |
|---|---|
| `purpose` | What the file does |
| `invariants` | Contracts and assumptions that must hold |
| `sensitiveDependencies` | Risky imports, env vars, external APIs |
| `importantDecisions` | Non-obvious architectural choices |
| `knownPitfalls` | Common failure modes |
| `impactValidation` | Where to verify before shipping — including real coverage data |
| `criticalityScore` | 0–1 heuristic — drives LLM prioritization |

Every field separates **`observed`** (static analysis, git, tests) from **`inferred`** (LLM synthesis). No hallucination hiding in the facts.

### Pipeline

```
repo → scanner → AST analyzer → graph engine → git intelligence
     → [cache check] → static note → [LLM synthesis] → .ai-notes/
```

**Key constraint:** LLM is only invoked when `criticalityScore >= llmThreshold` (default `0.4`). The rest of the pipeline is fully deterministic and auditable.

### Quickstart

```bash
# Install dependencies
bun install

# Discover eligible files
bun src/cli/index.ts scan --root ./

# Discover eligible files — machine-readable JSON output
bun src/cli/index.ts scan --root ./ --format json

# Full pipeline — writes .ai-notes/
bun src/cli/index.ts generate --root ./

# Bypass cache, reprocess everything
bun src/cli/index.ts generate --root ./ --force

# Scope to a subdirectory
bun src/cli/index.ts generate --root ./ --filter src/core/**

# Debug mode — verbose output with per-file details and timestamps
bun src/cli/index.ts generate --root ./ --debug

# Show field-level diff between old and new notes
bun src/cli/index.ts generate --root ./ --diff

# Dry run — preview without writing files
bun src/cli/index.ts generate --root ./ --dry-run

# Watch mode — regenerates on file change
bun src/cli/index.ts watch --root ./

# MCP server — expose notes to AI assistants
bun src/cli/index.ts mcp --root ./

# Auto-generate notes if missing, then start MCP server
bun src/cli/index.ts mcp --root ./ --auto-generate

# Local web UI
bun src/cli/index.ts ui --root ./

# Run tests
bun test
```

### Configuration

Create an `ai-notes.config.ts` at the root of your project:

```ts
// Ollama — local, no API key needed
export default {
  llm: { provider: 'ollama', model: 'llama3', llmThreshold: 0.4, temperature: 0.2 }
}

// Anthropic — set ANTHROPIC_API_KEY env var
export default {
  llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4 }
}

// OpenAI — set OPENAI_API_KEY env var
export default {
  llm: { provider: 'openai', model: 'gpt-4o', llmThreshold: 0.4 }
}
```

> **Security:** API keys must be set via environment variables only. Never put them in `ai-notes.config.ts`.

**Stale note detection** — notes older than `staleThresholdDays` (default: 30) are flagged with ⚠:

```ts
export default { staleThresholdDays: 14 }
```

**Multi-language support** — Python and Go are supported via opt-in:

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'
export default { include: MULTI_LANGUAGE_INCLUDE }
```

### Generated output

```
.ai-notes/
  src/
    core/
      scanner/discoverFiles.ts.json   ← structured note
      scanner/discoverFiles.ts.md     ← human-readable sidecar
  index.json                          ← all files ranked by criticalityScore
  index.md                            ← grouped by domain, avg score per group

cache/
  hashes.json                         ← SHA-1 per file for incremental runs
```

### MCP server

Expose braito notes as tools for AI assistants (Cursor, Claude Code, custom agents):

```bash
bun src/cli/index.ts mcp --root ./
```

| Tool | Description |
|---|---|
| `get_file_note` | Get the full note for a specific file |
| `search_by_criticality` | List files above a criticality threshold |
| `get_index` | Get the full ranked index |
| `get_architecture_context` | Synthesized overview — top critical files, domain breakdown, invariants |
| `get_impact` | Blast radius of a file — which files depend on it (BFS, configurable depth) |
| `search` | Full-text search across all note fields |
| `get_domain` | All files in a specific domain, sorted by criticality |

Add to your MCP client config (e.g. `~/.cursor/mcp.json` or `~/.claude/config.json`):

```json
{
  "mcpServers": {
    "braito": {
      "command": "bun",
      "args": ["src/cli/index.ts", "mcp", "--root", "/path/to/your/project"]
    }
  }
}
```

### Web UI

```bash
bun src/cli/index.ts ui --root ./
# → http://localhost:7842
```

Browse notes grouped by domain, filter by criticality score, and view all fields per file.

### VS Code Extension

The `vscode-extension/` directory contains a native VS Code extension:

- **File decorations** — `⚡` on high-criticality files, `⚠` on stale notes in the Explorer
- **Hover provider** — hovering over an import shows the purpose and criticality of the imported file
- **Command:** `braito: Show Note for Current File` — opens the full `.md` sidecar as a webview panel

Run `braito generate` first. The extension activates automatically when `.ai-notes/` exists.

### Architecture

| Layer | Path | Responsibility |
|---|---|---|
| CLI | `src/cli/` | Command orchestration — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Scanner | `src/core/scanner/` | File discovery via `Bun.Glob`, include/exclude/ignore rules |
| AST | `src/core/ast/` | `ts-morph` for TS/JS; `LanguageAnalyzer` interface; Python and Go analyzers |
| Graph | `src/core/graph/` | Direct + reverse dependency graphs; bundler alias resolution; cycle detection |
| Git | `src/core/git/` | Churn score, recent commits, co-changed files, author count |
| Tests | `src/core/tests/` | Heuristic test discovery; lcov/c8 coverage integration |
| Cache | `src/core/cache/` | SHA-1 per file, skip unchanged files, stale note detection |
| LLM | `src/core/llm/` | Provider abstraction, retry/timeout, prompt builder, Zod schema validation |
| Output | `src/core/output/` | JSON/Markdown serialization, domain-grouped index, sidecar writing |

### CI integration

`.github/workflows/ai-notes.yml` triggers on push to `main`/`master` when source files change.

Requires:
- `fetch-depth: 0` — full git history for accurate churn signals
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` as repository secrets (if using cloud LLM providers)

### Principles

1. **Static analysis first** — the majority of the pipeline is deterministic. LLM enriches, not replaces.
2. **Reduced context per file** — never send the entire repo to the model.
3. **Observed vs inferred** — always separated, always explicit.
4. **Sidecar, not inline** — notes live in `.ai-notes/`, not as code comments.
5. **Criticality-driven** — high-churn, high-consumer, and hook-heavy files are prioritized.

---

## Português

### O que faz

O Braito analisa seu repositório e gera um diretório `.ai-notes/` com um sidecar `.json` + `.md` por arquivo. Cada nota contém:

| Campo | Descrição |
|---|---|
| `purpose` | O que o arquivo faz |
| `invariants` | Contratos e premissas que devem ser mantidos |
| `sensitiveDependencies` | Imports arriscados, variáveis de ambiente, APIs externas |
| `importantDecisions` | Escolhas arquiteturais não óbvias |
| `knownPitfalls` | Modos de falha conhecidos |
| `impactValidation` | Onde verificar antes de fazer deploy — incluindo cobertura de testes real |
| `criticalityScore` | Heurística 0–1 — define prioridade de síntese por LLM |

Cada campo separa **`observed`** (análise estática, git, testes) de **`inferred`** (síntese por LLM). Nenhuma alucinação se esconde nos fatos.

### Pipeline

```
repo → scanner → analisador AST → grafo de dependências → sinais do git
     → [verificação de cache] → nota estática → [síntese LLM] → .ai-notes/
```

**Restrição principal:** o LLM só é invocado quando `criticalityScore >= llmThreshold` (padrão `0.4`). O restante do pipeline é totalmente determinístico e auditável.

### Início rápido

```bash
# Instalar dependências
bun install

# Descobrir arquivos elegíveis
bun src/cli/index.ts scan --root ./

# Saída em JSON (legível por máquina)
bun src/cli/index.ts scan --root ./ --format json

# Pipeline completo — grava .ai-notes/
bun src/cli/index.ts generate --root ./

# Ignorar cache, reprocessar tudo
bun src/cli/index.ts generate --root ./ --force

# Escopo para subdiretório
bun src/cli/index.ts generate --root ./ --filter src/core/**

# Modo debug — saída detalhada com timestamps
bun src/cli/index.ts generate --root ./ --debug

# Diferença campo a campo entre notas antigas e novas
bun src/cli/index.ts generate --root ./ --diff

# Dry run — visualizar sem gravar nenhum arquivo
bun src/cli/index.ts generate --root ./ --dry-run

# Modo watch — regenera ao detectar mudanças
bun src/cli/index.ts watch --root ./

# Servidor MCP — expõe notas para assistentes de IA
bun src/cli/index.ts mcp --root ./

# Gera notas automaticamente se não existirem e inicia o MCP
bun src/cli/index.ts mcp --root ./ --auto-generate

# Interface web local
bun src/cli/index.ts ui --root ./

# Executar testes
bun test
```

### Configuração

Crie um arquivo `ai-notes.config.ts` na raiz do projeto:

```ts
// Ollama — local, sem chave de API
export default {
  llm: { provider: 'ollama', model: 'llama3', llmThreshold: 0.4, temperature: 0.2 }
}

// Anthropic — defina a variável ANTHROPIC_API_KEY
export default {
  llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4 }
}

// OpenAI — defina a variável OPENAI_API_KEY
export default {
  llm: { provider: 'openai', model: 'gpt-4o', llmThreshold: 0.4 }
}
```

> **Segurança:** chaves de API devem ser definidas apenas por variáveis de ambiente. Nunca as coloque no `ai-notes.config.ts`.

**Detecção de notas antigas** — notas mais antigas que `staleThresholdDays` (padrão: 30) são marcadas com ⚠:

```ts
export default { staleThresholdDays: 14 }
```

**Suporte multi-linguagem** — Python e Go são suportados via opt-in:

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'
export default { include: MULTI_LANGUAGE_INCLUDE }
```

### Saída gerada

```
.ai-notes/
  src/
    core/
      scanner/discoverFiles.ts.json   ← nota estruturada
      scanner/discoverFiles.ts.md     ← sidecar legível por humanos
  index.json                          ← todos os arquivos ranqueados por criticalityScore
  index.md                            ← agrupado por domínio, score médio por grupo

cache/
  hashes.json                         ← SHA-1 por arquivo para execuções incrementais
```

### Servidor MCP

Exponha as notas do Braito como ferramentas para assistentes de IA (Cursor, Claude Code, agentes customizados):

```bash
bun src/cli/index.ts mcp --root ./
```

| Ferramenta | Descrição |
|---|---|
| `get_file_note` | Retorna a nota completa de um arquivo específico |
| `search_by_criticality` | Lista arquivos acima de um threshold de criticidade |
| `get_index` | Retorna o índice completo ranqueado |
| `get_architecture_context` | Visão arquitetural sintetizada — top arquivos críticos, domínios, invariants |
| `get_impact` | Blast radius de um arquivo — quais arquivos dependem dele (BFS, profundidade configurável) |
| `search` | Busca textual em todos os campos das notas |
| `get_domain` | Todos os arquivos de um domínio específico, ordenados por criticidade |

Adicione ao config do seu cliente MCP (ex: `~/.cursor/mcp.json` ou `~/.claude/config.json`):

```json
{
  "mcpServers": {
    "braito": {
      "command": "bun",
      "args": ["src/cli/index.ts", "mcp", "--root", "/caminho/do/seu/projeto"]
    }
  }
}
```

### Interface Web

```bash
bun src/cli/index.ts ui --root ./
# → http://localhost:7842
```

Navegue pelas notas agrupadas por domínio, filtre por score de criticidade e visualize todos os campos por arquivo.

### Extensão VS Code

O diretório `vscode-extension/` contém uma extensão nativa para VS Code:

- **Decorações** — `⚡` em arquivos de alta criticidade, `⚠` em notas antigas no Explorer
- **Hover** — passar o mouse sobre um import exibe o propósito e criticidade do arquivo importado
- **Comando:** `braito: Show Note for Current File` — abre o sidecar `.md` completo em um painel webview

Execute `braito generate` primeiro. A extensão ativa automaticamente quando `.ai-notes/` existe.

### Arquitetura

| Camada | Caminho | Responsabilidade |
|---|---|---|
| CLI | `src/cli/` | Orquestração dos comandos — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Scanner | `src/core/scanner/` | Descoberta de arquivos via `Bun.Glob`, regras de include/exclude |
| AST | `src/core/ast/` | `ts-morph` para TS/JS; interface `LanguageAnalyzer`; analisadores Python e Go |
| Graph | `src/core/graph/` | Grafos de dependência diretos e reversos; resolução de aliases; detecção de ciclos |
| Git | `src/core/git/` | Score de churn, commits recentes, co-mudanças, contagem de autores |
| Tests | `src/core/tests/` | Descoberta heurística de testes; integração com lcov/c8 |
| Cache | `src/core/cache/` | SHA-1 por arquivo, pular arquivos inalterados, detecção de notas antigas |
| LLM | `src/core/llm/` | Abstração de providers, retry/timeout, prompt builder, validação Zod |
| Output | `src/core/output/` | Serialização JSON/Markdown, índice agrupado por domínio, escrita de sidecars |

### Integração com CI

`.github/workflows/ai-notes.yml` é acionado em push para `main`/`master` quando arquivos fonte mudam.

Requisitos:
- `fetch-depth: 0` — histórico git completo para sinais de churn precisos
- `ANTHROPIC_API_KEY` ou `OPENAI_API_KEY` como secrets do repositório (se usar LLM na nuvem)

### Princípios

1. **Análise estática primeiro** — a maior parte do pipeline é determinística. LLM enriquece, não substitui.
2. **Contexto reduzido por arquivo** — nunca envia o repositório inteiro para o modelo.
3. **Observed vs inferred** — sempre separados, sempre explícitos.
4. **Sidecar, não inline** — notas ficam em `.ai-notes/`, não como comentários no código.
5. **Orientado por criticidade** — arquivos com alto churn, muitos consumidores e hooks são priorizados.
