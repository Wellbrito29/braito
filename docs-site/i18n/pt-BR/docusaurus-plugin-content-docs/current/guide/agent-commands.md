---
sidebar_position: 7
---

# Slash Commands para Agentes

O braito pode gerar arquivos de slash commands nativos para assistentes de IA, tornando as ferramentas do braito (consulta de notas, análise de impacto, busca) disponíveis como comandos de primeira classe — sem necessidade de configuração manual do MCP.

## Configuração

Execute `init --agent` uma vez na raiz do projeto:

```bash
bun src/cli/index.ts init --agent --root ./
```

Isso cria três arquivos em `.claude/commands/`:

```
.claude/
└── commands/
    ├── braito-note.md
    ├── braito-impact.md
    └── braito-search.md
```

## Comandos disponíveis

Após gerados, os seguintes slash commands ficam disponíveis no Claude Code e Cursor:

### `/braito-note [caminho-do-arquivo]`

Exibe a nota braito completa de um arquivo: propósito, invariantes, dependências sensíveis, decisões importantes, armadilhas conhecidas e validação de impacto.

```
/braito-note src/core/llm/synthesizeFileNote.ts
```

### `/braito-impact <caminho-do-arquivo>`

Exibe a análise de raio de impacto para um arquivo. Usa BFS no grafo de dependências reverso para listar todos os arquivos transitivamente afetados, agrupados por nível, com scores de criticidade e domínios.

```
/braito-impact src/core/types/ai-note.ts
```

### `/braito-search <consulta>`

Busca de texto completo em todas as notas geradas. Faz match em fatos observados, conteúdo inferido pelo LLM e detalhes de evidências de todos os arquivos do projeto.

```
/braito-search "race condition"
/braito-search "autenticação"
/braito-search "variável de ambiente"
```

## Como funciona

Os arquivos de comando são Markdowns padrão que o Claude Code e o Cursor reconhecem como slash commands personalizados. Eles instruem o assistente a usar a ferramenta MCP correspondente do braito para buscar e exibir o resultado.

Para isso funcionar, o servidor MCP do braito precisa estar configurado no seu editor. Veja [Servidor MCP](./mcp-server) para instruções de configuração.

## Idempotente

Executar `init --agent` várias vezes é seguro — os arquivos de comando são sobrescritos com a versão atual. Execute novamente após atualizar o braito para obter as definições mais recentes.

## Complemento com a constituição do projeto

Combine os slash commands de agente com o arquivo `braito.context.md` (veja [Configuração](./configuration#constituição-do-projeto)) para que o assistente de IA tenha tanto acesso a notas em tempo real via slash commands quanto conhecimento estrutural do projeto injetado em toda síntese LLM.
