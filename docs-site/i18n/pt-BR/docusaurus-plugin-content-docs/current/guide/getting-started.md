---
sidebar_position: 1
---

# Início Rápido

## Pré-requisitos

- [Bun](https://bun.sh) ≥ 1.0
- Um projeto TypeScript ou JavaScript com repositório git

## Instalação

```bash
git clone https://github.com/wellbrito29/braito.git
cd braito
bun install
```

## Primeira execução

```bash
bun run scan        # listar todos os arquivos elegíveis
bun run generate    # gerar notas (apenas estático, sem LLM)
```

Isso cria um diretório `.ai-notes/` com um sidecar `.json` + `.md` por arquivo, mais um `index.json` e `index.md` de resumo.

## Ativar síntese LLM

Defina sua chave de API e configure um provider em `ai-notes.config.ts`:

```ts
// ai-notes.config.ts
export default {
  llm: {
    provider: 'anthropic',          // 'anthropic' | 'openai' | 'ollama' | 'claude-cli'
    model: 'claude-sonnet-4-6',
    llmThreshold: 0.4,              // apenas arquivos acima desse score vão para o LLM
  },
}
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun run generate
```

Arquivos com `criticalityScore >= llmThreshold` são enviados ao LLM. Os demais recebem uma nota estática rápida.

## Comandos CLI

| Script | Flags extras | Descrição |
|---|---|---|
| `bun run scan` | `--format json` | Descobrir e listar arquivos elegíveis |
| `bun run generate` | `--filter` `--diff` `--language` | Pipeline completo — grava `.ai-notes/` |
| `bun run generate:force` | — | Ignorar cache, reprocessar tudo |
| `bun run generate:dry` | — | Visualizar sem gravar arquivos |
| `bun run generate:v` | — | Detalhe por arquivo + timers por fase |
| `bun run watch` | — | Regenerar ao detectar mudanças |
| `bun run mcp` | `--auto-generate` | Servidor MCP (JSON-RPC 2.0 via stdio) |
| `bun run ui` | `--port <n>` | Interface web local em `http://localhost:7842` |
| `bun run init:agent` | — | Gerar arquivos slash command em `.claude/commands/` |
| `bun test` | — | Executar todos os testes |

## Saída gerada

```
.ai-notes/
  src/
    core/
      scanner/discoverFiles.ts.json   ← nota estruturada
      scanner/discoverFiles.ts.md     ← sidecar legível por humanos
  index.json                          ← todos os arquivos ranqueados por criticidade
  index.md                            ← agrupado por domínio

cache/
  hashes.json                         ← SHA-1 por arquivo para execuções incrementais
```

Não edite `.ai-notes/` ou `cache/` manualmente — são regenerados a cada execução.

## Próximos passos

- [Configuração](./configuration) — todas as opções de configuração
- [Servidor MCP](./mcp-server) — conectar ao Cursor ou Claude Code
- [Interface Web](./web-ui) — navegar pelas notas no browser
