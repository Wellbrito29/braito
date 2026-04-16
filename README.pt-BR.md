<p align="center">
  <img src="docs/assets/braito.png" alt="Braito — Contexto operacional para codebases" width="600" />
</p>

<p align="center">
  <strong>Contexto operacional para codebases.</strong><br/>
  Braito analisa repositórios TypeScript/JavaScript e gera sidecars de conhecimento estruturado por arquivo — impulsionado por análise estática, inteligência git e síntese LLM opcional.
</p>

<p align="center">
  <img alt="Built with Bun" src="https://img.shields.io/badge/built%20with-Bun-f9f1e1?logo=bun&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white" />
  <img alt="Status" src="https://img.shields.io/badge/status-operational-brightgreen" />
</p>

<p align="center">
  <a href="https://wellbrito29.github.io/braito/">Documentação</a> &nbsp;·&nbsp;
  <a href="README.md">Read in English</a>
</p>

---

## O que faz

Braito escaneia seu codebase e gera um diretório `.ai-notes/` com um sidecar `.json` + `.md` por arquivo. Cada nota contém:

| Campo | Descrição |
|---|---|
| `purpose` | O que o arquivo faz |
| `invariants` | Contratos e suposições que devem ser mantidos |
| `sensitiveDependencies` | Imports arriscados, env vars, APIs externas |
| `importantDecisions` | Escolhas arquiteturais não óbvias |
| `knownPitfalls` | Modos de falha comuns |
| `impactValidation` | Onde verificar antes de fazer deploy — incluindo dados reais de cobertura |
| `criticalityScore` | Heurística de 0–1 — orienta priorização do LLM |

Cada campo separa **`observed`** (análise estática, git, testes) de **`inferred`** (síntese LLM). Nenhuma alucinação escondida nos fatos.

---

## Pipeline

```
repo → scanner → analisador AST → motor de grafo → inteligência git
     → [verificação de cache] → nota estática → [síntese LLM] → .ai-notes/
```

**Restrição principal:** LLM é invocado apenas quando `criticalityScore >= llmThreshold` (padrão `0.4`). O restante do pipeline é determinístico e auditável.

---

## Início rápido

```bash
bun install
bun run scan              # descobrir arquivos
bun run generate          # pipeline completo → .ai-notes/
bun run generate:force    # ignorar cache
bun run generate:dry      # visualizar sem gravar
bun run generate:v        # verbose — sinais por arquivo + timers
bun run watch             # regenerar ao detectar mudanças
bun run ui                # interface web em http://localhost:7842
bun run mcp               # servidor MCP (Cursor / Claude Code)
bun run init:agent        # gerar slash commands em .claude/commands/
bun test
```

---

## Configuração

Crie um `ai-notes.config.ts` na raiz do projeto:

```ts
// Ollama — local, sem chave de API
export default {
  llm: { provider: 'ollama', model: 'llama3', llmThreshold: 0.4, temperature: 0.2 },
  language: 'pt-BR',
}

// Anthropic — defina a variável ANTHROPIC_API_KEY
export default {
  llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4 },
  language: 'pt-BR',
}

// OpenAI — defina a variável OPENAI_API_KEY
export default {
  llm: { provider: 'openai', model: 'gpt-4o', llmThreshold: 0.4 },
}

// Claude CLI — usa sua sessão do Claude Code já autenticada (sem chave de API)
// Requer o binário `claude` no PATH — veja https://docs.claude.com/pt/docs/claude-code
export default {
  llm: { provider: 'claude-cli', model: 'claude-sonnet-4-6', llmThreshold: 0.4 },
}

// Modelos em tiers — default barato, modelo premium só para os arquivos mais críticos
export default {
  llm: {
    provider: 'claude-cli',
    model: 'claude-sonnet-4-6',      // default: score >= llmThreshold e < highThreshold
    highModel: 'claude-opus-4-6',    // premium: score >= highThreshold
    highThreshold: 0.7,              // padrão 0.7 quando highModel está definido
    llmThreshold: 0.4,               // abaixo disso, sem LLM
  },
}
```

> **Segurança:** chaves de API devem ser definidas apenas por variáveis de ambiente. Nunca coloque-as no `ai-notes.config.ts`.
> O provider `claude-cli` dispensa a chave de API — ele autentica via sua sessão local do Claude Code.

**Saída multilíngue** — o conteúdo sintetizado pelo LLM (campos `inferred`) é gerado no idioma configurado. A flag `--language` na CLI sobrepõe a configuração:

```bash
bun src/cli/index.ts generate --root ./ --language pt-BR
bun src/cli/index.ts generate --root ./ --language es
```

Suportado: qualquer tag BCP 47 (`en`, `pt-BR`, `es`, `fr`, `de`, etc.).

**Detecção de notas antigas:**

```ts
export default { staleThresholdDays: 14 }
```

**Suporte a múltiplas linguagens de código-fonte** — Python e Go por opt-in:

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'
export default { include: MULTI_LANGUAGE_INCLUDE }
```

**Ensine o braito sobre seus SDKs internos** — o bloco `analysis` é mesclado com os padrões embutidos (observabilidade, filas, agendadores, realtime, caches, feature flags, etc.). Útil quando um pacote privado dispara efeitos colaterais ou quando um cliente HTTP customizado deve contar como chamada de API:

```ts
export default {
  analysis: {
    sideEffectPackages: ['minha-empresa-tracing', 'cliente-fila-interno'],
    apiCallPatterns: [
      "meuHttpClient\\.(?:get|post|put|delete)\\s*\\(\\s*['\"]([^'\"]+)['\"]",
    ],
  },
}
```

---

## Saída gerada

```
.ai-notes/
  src/
    core/
      scanner/discoverFiles.ts.json
      scanner/discoverFiles.ts.md
  index.json
  index.md

cache/
  hashes.json
```

---

## Servidor MCP

```bash
bun src/cli/index.ts mcp --root ./

# Modo multi-repo — serve múltiplos projetos em um único servidor MCP
bun src/cli/index.ts mcp --roots "api=/caminho/api,web=/caminho/web"
```

No modo multi-repo, cada chamada de ferramenta aceita um argumento `repo` (use `list_repos` para enumerar os aliases). Com apenas um repo registrado, `repo` é opcional.

| Ferramenta | Descrição |
|---|---|
| `list_repos` | Lista repositórios registrados no servidor MCP (modo multi-repo) |
| `get_file_note` | Obtém a nota completa de um arquivo específico |
| `search_by_criticality` | Lista arquivos acima de um threshold de criticidade |
| `get_index` | Obtém o índice completo ranqueado |
| `get_architecture_context` | Visão geral sintetizada — arquivos mais críticos, breakdown por domínio, invariantes |
| `get_impact` | Raio de impacto de um arquivo — quais arquivos dependem dele (BFS, profundidade configurável) |
| `search` | Busca BM25 ranqueada em todos os campos de notas (fuzzy + prefix) |
| `get_domain` | Todos os arquivos em um domínio específico, ordenados por criticidade |
| `get_business_rules` | Extrai regras de negócio, restrições de domínio e padrões de validação de um arquivo |
| `get_governance_context` | Documentos de governança detectados (Docs/, Workflows/, Quality/), estilo, mapeamentos de domínio |
| `get_divergences` | Divergências estruturais entre docs de governança e o código — arquivos ausentes, dependências proibidas, domínios não declarados, hotspots não documentados |

Adicione à configuração do cliente MCP (ex: `~/.cursor/mcp.json` ou `~/.claude/config.json`):

```json
{
  "mcpServers": {
    "braito": {
      "command": "bun",
      "args": ["src/cli/index.ts", "mcp", "--root", "/caminho/para/seu/projeto"]
    }
  }
}
```

---

## Interface Web

```bash
bun src/cli/index.ts ui --root ./
# → http://localhost:7842
```

Navegue pelas notas agrupadas por domínio com quatro abas por arquivo: **Note** (purpose, invariantes, pitfalls, decisões), **Debug** (breakdown de score, evidências), **Tests** (cobertura, testes relacionados) e **Graph** (visualização interativa de grafo de dependências com D3.js, zoom, drag, highlight de vizinhos e filtro por score).

---

## Extensão VS Code

O diretório `vscode-extension/` contém uma extensão nativa para VS Code:

- **Decorações de arquivo** — `⚡` em arquivos de alta criticidade, `⚠` em notas antigas
- **Hover provider** — passar o mouse sobre um import mostra o propósito e a criticidade do arquivo importado
- **Comando:** `braito: Show Note for Current File`

---

## Arquitetura

| Camada | Caminho | Responsabilidade |
|---|---|---|
| CLI | `src/cli/` | Orquestração de comandos — `scan`, `generate`, `watch`, `mcp`, `ui` |
| Scanner | `src/core/scanner/` | Descoberta de arquivos via `Bun.Glob` |
| AST | `src/core/ast/` | `ts-morph` para TS/JS; analisadores Python e Go |
| Graph | `src/core/graph/` | Grafos de dependência; resolução de aliases de bundler; detecção de ciclos |
| Git | `src/core/git/` | Score de churn, commits recentes, arquivos co-modificados |
| Tests | `src/core/tests/` | Descoberta de testes; integração lcov/c8 |
| Cache | `src/core/cache/` | SHA-1 por arquivo, detecção de notas antigas |
| LLM | `src/core/llm/` | Abstração de provider, retry/timeout, construtor de prompt, validação Zod |
| Output | `src/core/output/` | Serialização JSON/Markdown, índice agrupado por domínio, índice de busca BM25 |
| Governance | `src/core/governance/` | Detectar docs do projeto (Docs/, Workflows/, Quality/); injetar evidência `doc` |

---

## Integração CI

`.github/workflows/ai-notes.yml` é acionado em push para `main`/`master` quando arquivos fonte mudam. Requer `fetch-depth: 0` para sinais git precisos.

---

## Princípios

1. **Análise estática primeiro** — LLM enriquece, não substitui.
2. **Contexto reduzido por arquivo** — nunca envia o repositório inteiro ao modelo.
3. **Observado vs inferido** — sempre separados, sempre explícitos.
4. **Sidecar, não inline** — notas ficam em `.ai-notes/`, não como comentários de código.
5. **Orientado por criticidade** — arquivos com alto churn, muitos consumidores e hooks são priorizados.
