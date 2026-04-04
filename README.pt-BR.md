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
bun src/cli/index.ts scan --root ./
bun src/cli/index.ts generate --root ./
bun src/cli/index.ts generate --root ./ --force
bun src/cli/index.ts generate --root ./ --filter src/core/**
bun src/cli/index.ts generate --root ./ --language pt-BR
bun src/cli/index.ts generate --root ./ --diff
bun src/cli/index.ts generate --root ./ --dry-run
bun src/cli/index.ts watch --root ./
bun src/cli/index.ts mcp --root ./
bun src/cli/index.ts mcp --root ./ --auto-generate
bun src/cli/index.ts ui --root ./
bun src/cli/index.ts init --agent --root ./
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
```

> **Segurança:** chaves de API devem ser definidas apenas por variáveis de ambiente. Nunca coloque-as no `ai-notes.config.ts`.

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
```

| Ferramenta | Descrição |
|---|---|
| `get_file_note` | Obtém a nota completa de um arquivo específico |
| `search_by_criticality` | Lista arquivos acima de um threshold de criticidade |
| `get_index` | Obtém o índice completo ranqueado |
| `get_architecture_context` | Visão geral sintetizada — arquivos mais críticos, breakdown por domínio, invariantes |
| `get_impact` | Raio de impacto de um arquivo — quais arquivos dependem dele (BFS, profundidade configurável) |
| `search` | Busca de texto completo em todos os campos de notas |
| `get_domain` | Todos os arquivos em um domínio específico, ordenados por criticidade |

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
| Output | `src/core/output/` | Serialização JSON/Markdown, índice agrupado por domínio |

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
