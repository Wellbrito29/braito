---
sidebar_position: 3
---

# Servidor MCP

O braito expõe suas notas como ferramentas para assistentes de IA via [Model Context Protocol](https://modelcontextprotocol.io) (JSON-RPC 2.0 via stdio).

## Iniciar o servidor

```bash
bun src/cli/index.ts mcp --root /caminho/para/seu/projeto

# Gerar notas se não existirem e depois iniciar
bun src/cli/index.ts mcp --root /caminho/para/seu/projeto --auto-generate
```

## Conectar a um assistente de IA

Adicione o braito à configuração do seu cliente MCP:


**Cursor (~/.cursor/mcp.json)**:

```json
{
  "mcpServers": {
    "braito": {
      "command": "bun",
      "args": [
        "/caminho/para/braito/src/cli/index.ts",
        "mcp",
        "--root",
        "/caminho/para/seu/projeto"
      ]
    }
  }
}
```


**Claude Code (~/.claude/config.json)**:

```json
{
  "mcpServers": {
    "braito": {
      "command": "bun",
      "args": [
        "/caminho/para/braito/src/cli/index.ts",
        "mcp",
        "--root",
        "/caminho/para/seu/projeto"
      ]
    }
  }
}
```

:::

O servidor MCP também pode rodar fora de uma IDE — qualquer cliente que fale JSON-RPC 2.0 via stdio pode se conectar.

## Ferramentas disponíveis

| Ferramenta | Descrição |
|---|---|
| `get_file_note` | Nota completa de um arquivo específico |
| `search_by_criticality` | Arquivos acima de um threshold de criticidade, ordenados decrescentemente |
| `get_index` | Índice completo ranqueado de todas as notas |
| `get_architecture_context` | Visão geral sintetizada — arquivos mais críticos, breakdown por domínio, invariantes |
| `get_impact` | Raio de impacto de um arquivo — quais arquivos dependem dele (BFS, profundidade configurável) |
| `search` | Busca de texto completo em todos os campos de notas |
| `get_domain` | Todos os arquivos em um domínio específico, ordenados por criticidade |

## Detalhes das ferramentas

### `get_file_note`

```json
{ "tool": "get_file_note", "arguments": { "path": "src/core/llm/synthesizeFileNote.ts" } }
```

Retorna o JSON completo do `AiFileNote` para o arquivo especificado.

### `get_impact`

```json
{ "tool": "get_impact", "arguments": { "path": "src/core/types/ai-note.ts", "depth": 3 } }
```

Retorna `{ file, totalAffected, dependents: [{ relativePath, criticalityScore, domain, level }] }` via BFS do grafo de dependências reversas.

### `search`

```json
{ "tool": "search", "arguments": { "query": "timeout LLM" } }
```

Busca em todos os arrays `observed[]`, `inferred[]` e `evidence[].detail` de todas as notas. Retorna resultados ranqueados.

### `get_domain`

```json
{ "tool": "get_domain", "arguments": { "domain": "llm" } }
```

Retorna `{ domain, fileCount, avgCriticality, files }` — todos os arquivos cujo caminho contém o nome do domínio, ordenados por score decrescente.
