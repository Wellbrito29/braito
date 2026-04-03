# Modo Watch

O modo watch monitora seus arquivos fonte e regenera as notas automaticamente quando um arquivo muda.

## Iniciar

```bash
bun src/cli/index.ts watch --root ./

# Com idioma específico para o LLM
bun src/cli/index.ts watch --root ./ --language pt-BR
```

## Comportamento

- Na inicialização, executa um `generate` completo para todos os arquivos que não estão no cache.
- Monitora todos os arquivos que correspondem aos seus padrões `include`.
- A cada mudança: re-analisa o arquivo modificado, atualiza sua nota `.json` e `.md`, e reconstrói `index.json` e `index.md`.
- O cache é atualizado para que arquivos sem alteração nunca sejam reprocessados.
- A síntese LLM é acionada para arquivos modificados que atendam ao `llmThreshold`, igual a um `generate` normal.

## Casos de uso

- Desenvolvimento ativo: as notas se mantêm atualizadas enquanto você edita.
- Combinado com a [Interface Web](/pt/guide/web-ui): abra `http://localhost:7842` em outro terminal e recarregue para ver as notas atualizadas.
- Combinado com o [Servidor MCP](/pt/guide/mcp-server): seu assistente de IA sempre tem contexto atual.

::: tip
O modo watch é mais útil durante desenvolvimento ativo em um módulo complexo. Para CI, use `generate`.
:::
