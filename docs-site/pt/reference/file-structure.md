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

    core/
      config/
        loadConfig.ts
        defaults.ts
        configSchema.ts           ← schema de validação Zod

      scanner/
        scanRepository.ts
        discoverFiles.ts

      ast/
        parseFile.ts
        analyzerRegistry.ts
        extractSkeleton.ts        ← esqueleto de código para o prompt LLM
        types.ts                  ← interface LanguageAnalyzer
        analyzers/
          ts/
            extractImports.ts
            extractExports.ts
            extractExportDetails.ts   ← assinaturas tipadas + JSDoc
            extractSymbols.ts
            extractHooks.ts
            extractEnvUsage.ts
            extractApiCalls.ts
            extractComments.ts
            extractDynamicImports.ts
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
        getFileHistory.ts         ← churn + commits estruturados (hash, data, autor)
        getCoChangedFiles.ts
        getGitSignals.ts

      tests/
        findRelatedTests.ts
        loadCoverage.ts

      cache/
        computeHash.ts
        cacheStore.ts
        isNoteStale.ts
        analysisStore.ts

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
          systemPrompt.ts         ← regras com exemplos RUIM/BOM por campo
          buildPrompt.ts          ← usa extractSkeleton em vez de truncar linhas

      output/
        buildBasicNote.ts         ← inclui recentChanges e assinaturas tipadas
        buildIndex.ts
        writeJsonNote.ts
        writeMarkdownNote.ts      ← renderiza seção ## Recent Changes
        writeIndexNote.ts
        diffNotes.ts

      types/
        project.ts
        ai-note.ts                ← inclui ChangelogEntry e recentChanges
        file-analysis.ts          ← inclui ExportDetail e GitCommitEntry
        schema-version.ts

  vscode-extension/
    src/
      extension.ts
      noteReader.ts
      hoverProvider.ts
      decorationProvider.ts
      notePanel.ts

  tests/
  docs/
  docs-site/                      ← site VitePress (GitHub Pages)

  .ai-notes/      ← gerado, não editar manualmente
  cache/          ← gerado, não editar manualmente

  ai-notes.config.ts
  package.json
  tsconfig.json
  CLAUDE.md
  README.md
  README.pt-BR.md
  CHANGELOG.md
  TODO.md
```

## Regras práticas

### `src/cli`

Responsável apenas por orquestrar comandos e entrada do usuário. Sem lógica de negócio.

### `src/core`

Toda regra de negócio fica aqui. Cada subdiretório é um módulo independente.

### `src/core/ast`

Modular por linguagem. Para adicionar uma nova linguagem, implemente `LanguageAnalyzer` e registre em `analyzerRegistry.ts`.

### `src/core/llm`

Separar: provider, sintetizador, lógica de retry. Providers são trocáveis sem alterar o pipeline.

### `src/core/output`

Todos os formatos de saída ficam isolados aqui.

### `.ai-notes/` e `cache/`

Gerados pela ferramenta. Nunca edite manualmente — são regenerados a cada execução.
