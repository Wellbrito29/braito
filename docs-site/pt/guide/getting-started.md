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
# Listar todos os arquivos elegíveis do seu projeto
bun src/cli/index.ts scan --root /caminho/para/seu/projeto

# Gerar notas para todos os arquivos (apenas estático, sem LLM)
bun src/cli/index.ts generate --root /caminho/para/seu/projeto
```

Isso cria um diretório `.ai-notes/` com um sidecar `.json` + `.md` por arquivo, mais um `index.json` e `index.md` de resumo.

## Ativar síntese LLM

Defina sua chave de API e configure um provider em `ai-notes.config.ts`:

```ts
// ai-notes.config.ts
export default {
  llm: {
    provider: 'anthropic',          // 'anthropic' | 'openai' | 'ollama'
    model: 'claude-sonnet-4-6',
    llmThreshold: 0.4,              // apenas arquivos acima desse score vão para o LLM
  },
}
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun src/cli/index.ts generate --root ./
```

Arquivos com `criticalityScore >= llmThreshold` são enviados ao LLM. Os demais recebem uma nota estática rápida.

## Comandos CLI

| Comando | Descrição |
|---|---|
| `scan --root ./` | Descobrir e listar arquivos elegíveis |
| `scan --root ./ --format json` | Lista legível por máquina |
| `generate --root ./` | Pipeline completo — grava `.ai-notes/` |
| `generate --root ./ --force` | Ignorar cache, reprocessar tudo |
| `generate --root ./ --filter src/core/**` | Escopo para um subdiretório |
| `generate --root ./ --language pt-BR` | Saída LLM em um idioma específico |
| `generate --root ./ --diff` | Mostrar diferença campo a campo entre execuções |
| `generate --root ./ --dry-run` | Visualizar sem gravar arquivos |
| `watch --root ./` | Watch mode — regenerar ao detectar mudanças |
| `mcp --root ./` | Iniciar servidor MCP (JSON-RPC 2.0 via stdio) |
| `mcp --root ./ --auto-generate` | Gerar notas se não existirem e iniciar MCP |
| `ui --root ./` | Interface web local em `http://localhost:7842` |

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

- [Configuração](/pt/guide/configuration) — todas as opções de configuração
- [Servidor MCP](/pt/guide/mcp-server) — conectar ao Cursor ou Claude Code
- [Interface Web](/pt/guide/web-ui) — navegar pelas notas no browser
