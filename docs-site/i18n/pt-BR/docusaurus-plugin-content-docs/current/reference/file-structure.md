---
sidebar_position: 4
---

# Estrutura de Arquivos

```text
braito/
  src/
    cli/
      index.ts                    ← ponto de entrada, parsing de argumentos
      commands/
        scan.ts
        generate.ts
        watch.ts
        mcp.ts
        ui.ts
        init.ts                   ← gera slash commands para agentes
        update.ts                 ← regenera apenas notas defasadas

    core/
      config/
        loadConfig.ts
        defaults.ts
        configSchema.ts           ← schema de validação Zod
        loadProjectContext.ts     ← lê braito.context.md

      scanner/
        scanRepository.ts
        discoverFiles.ts
        ignoreRules.ts

      ast/
        parseFile.ts              ← dispatcher por linguagem
        analyzerRegistry.ts
        types.ts                  ← interface LanguageAnalyzer
        analyzers/
          ts/
            extractImports.ts
            extractExports.ts
            extractExportDetails.ts
            extractSymbols.ts
            extractHooks.ts
            extractComments.ts
            extractSignatures.ts
            extractEnvUsage.ts
            extractApiCalls.ts
          python/
            pythonAnalyzer.ts
          go/
            goAnalyzer.ts

      graph/
        buildDependencyGraph.ts
        buildReverseDependencyGraph.ts
        resolveImportPath.ts
        loadBundlerAliases.ts
        detectCycles.ts

      git/
        getFileHistory.ts
        getCoChangedFiles.ts
        getGitSignals.ts

      tests/
        findRelatedTests.ts
        loadCoverage.ts
        parseLcov.ts

      cache/
        computeHash.ts
        cacheStore.ts
        analysisStore.ts
        isCacheValid.ts
        isNoteStale.ts

      business/
        extractBusinessRules.ts   ← extrator heurístico usado pelo MCP

      governance/
        detectGovernanceModel.ts
        loadGovernanceContext.ts
        types.ts

      llm/
        synthesizeFileNote.ts
        retry.ts
        provider/
          factory.ts
          anthropic.ts
          openai.ts
          ollama.ts
          types.ts
        prompts/
          buildPrompt.ts
          systemPrompt.ts
        schemas/
          aiNoteSchema.ts         ← schema Zod da resposta do LLM

      output/
        buildBasicNote.ts
        buildIndex.ts
        buildSearchIndex.ts       ← índice BM25 via MiniSearch
        writeJsonNote.ts
        writeMarkdownNote.ts
        writeIndexNote.ts
        writeGraph.ts             ← persiste .ai-notes/graph.json
        diffNotes.ts

      utils/
        logger.ts
        progress.ts
        concurrentMap.ts

      types/
        project.ts
        ai-note.ts
        file-analysis.ts
        schema-version.ts

  vscode-extension/
    src/
      extension.ts
      noteReader.ts
      hoverProvider.ts
      decorationProvider.ts
      notePanel.ts
    package.json
    tsconfig.json

  tests/
    ast/
    cache/
    cli/
    config/
    e2e/
    git/
    governance/
    graph/
    llm/
    mcp/
    output/
    scanner/
    tests/
    utils/

  docs-site/                      ← site Docusaurus (fonte única da documentação)
    docs/
      guide/
      reference/
    i18n/pt-BR/…

  .github/
    workflows/
      ai-notes.yml

  .ai-notes/      ← gerado, não edite manualmente
  cache/          ← gerado, não edite manualmente

  ai-notes.config.ts
  braito.context.md                ← constituição do projeto (opcional) injetada nos prompts LLM
  package.json
  tsconfig.json
  bun.lock
  CLAUDE.md
  README.md
  README.pt-BR.md
  CHANGELOG.md
  TODO.md
```

## Regras das camadas

### `src/cli`

Responsável apenas por orquestrar comandos e parsing de entrada. Sem regra de negócio.

### `src/core`

Toda a lógica de negócio vive aqui. Cada subpasta é um módulo autocontido.

### `src/core/ast`

Modular por linguagem. Para adicionar uma nova, implemente `LanguageAnalyzer` e registre em `analyzerRegistry.ts`. Os extractors de TypeScript/JavaScript ficam em `analyzers/ts/`, um por arquivo.

### `src/core/llm`

Separado: provider, synthesizer, retry, prompts e schemas de resposta. Providers são trocáveis sem alterar o pipeline.

### `src/core/business`

Extratores heurísticos estáticos para regras de domínio (limites numéricos, guards de permissão, validações de schema, constantes de negócio). Consumidos pela tool MCP `get_business_rules`. Sem dependência de LLM — funções puras sobre o texto do código.

### `src/core/governance`

Detecta artefatos de documentação do projeto (`Docs/`, `Workflows/`, `Quality/`, `Skills/`) e injeta itens `doc` de evidência nas notas. `buildBasicNote` recebe o `GovernanceContext` opcional.

### `src/core/output`

Todos os formatos de saída ficam aqui: sidecars JSON estruturados, Markdown legível, índice ranqueado, grafo de dependências (`graph.json`) e índice de busca BM25.

### `.ai-notes/` e `cache/`

Gerados pela ferramenta. Nunca edite manualmente — são regenerados a cada execução.
