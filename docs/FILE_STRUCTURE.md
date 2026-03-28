# Estrutura de Pastas Sugerida

```text
ai-file-notes/
  src/
    cli/
      index.ts
      commands/
        scan.ts
        generate.ts
        publish.ts
        watch.ts

    core/
      config/
        loadConfig.ts
        defaults.ts

      scanner/
        scanRepository.ts
        discoverFiles.ts
        ignoreRules.ts

      ast/
        parseFile.ts
        analyzers/
          ts/
            analyzeTsFile.ts
            extractImports.ts
            extractExports.ts
            extractFunctions.ts
            extractHooks.ts
            extractEnvUsage.ts
            extractApiCalls.ts
            extractComments.ts

      graph/
        buildDependencyGraph.ts
        buildReverseDependencyGraph.ts
        resolveRelatedFiles.ts

      git/
        getFileHistory.ts
        getCoChangedFiles.ts
        getRecentCommits.ts
        getBlameHints.ts

      tests/
        findRelatedTests.ts
        mapTestCoverageHints.ts

      context/
        buildFileContext.ts
        buildDomainContext.ts
        buildPromptPayload.ts

      llm/
        provider/
          openai.ts
        prompts/
          systemPrompt.ts
          fileSynthesisPrompt.ts
        schemas/
          aiNoteSchema.ts
        synthesizeFileNote.ts

      ranking/
        scoreCriticality.ts
        scoreConfidence.ts

      output/
        writeJsonNote.ts
        writeMarkdownNote.ts
        injectFileHeader.ts
        buildSummaryIndex.ts

      types/
        project.ts
        file-analysis.ts
        ai-note.ts

      utils/
        hash.ts
        logger.ts
        path.ts

  docs/
  .ai-notes/
  cache/
  package.json
  tsconfig.json
  ai-notes.config.ts
```

## Regras práticas

### `src/cli`

Responsável apenas por orquestrar comando e entrada do usuário.

### `src/core`

Toda regra de negócio fica aqui.

### `src/core/ast`

Deve ser modular por linguagem. Mesmo que o MVP seja TS/TSX, deixe o desenho preparado para expansão.

### `src/core/context`

Não deve conter lógica de parsing. Só composição de contexto.

### `src/core/llm`

Separar:

- provider
- prompt
- schema
- sintetizador

### `src/core/output`

Todo formato de saída deve ficar isolado aqui.

### `.ai-notes`

Saída gerada pela ferramenta. Não editar manualmente.

### `cache`

Hashes e resultados intermediários para evitar recomputação e custo desnecessário.
