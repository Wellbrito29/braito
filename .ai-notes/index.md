# AI Notes Index

**Generated:** 2026-03-29 | **Total files:** 46 | **LLM synthesized:** 0

## Files by Criticality

| Score | File | Model | Purpose |
|-------|------|-------|---------|
| 0.52 | [src/core/types/file-analysis.ts](./src/core/types/file-analysis.ts.md) | static | Exports: StaticFileAnalysis, GraphSignals, TestSignals, GitSignals |
| 0.52 | [src/core/types/project.ts](./src/core/types/project.ts.md) | static | Exports: DiscoveredFile, LLMProviderName, LLMConfig, AiNotesConfig |
| 0.51 | [src/core/cache/cacheStore.ts](./src/core/cache/cacheStore.ts.md) | static | Exports: loadCache, saveCache, HashStore |
| 0.51 | [src/core/config/loadConfig.ts](./src/core/config/loadConfig.ts.md) | static | Exports: loadConfig |
| 0.51 | [src/core/llm/provider/types.ts](./src/core/llm/provider/types.ts.md) | static | Exports: LLMRequest, LLMResponse, LLMProvider |
| 0.51 | [src/core/output/buildIndex.ts](./src/core/output/buildIndex.ts.md) | static | Exports: buildIndex, IndexEntry, NoteIndex |
| 0.51 | [src/core/types/ai-note.ts](./src/core/types/ai-note.ts.md) | static | Exports: EvidenceItem, StructuredListField, AiFileNote |
| 0.51 | [src/core/utils/logger.ts](./src/core/utils/logger.ts.md) | static | Exports: logger |
| 0.41 | [src/core/ast/parseFile.ts](./src/core/ast/parseFile.ts.md) | static | Exports: parseFile |
| 0.41 | [src/core/cache/computeHash.ts](./src/core/cache/computeHash.ts.md) | static | Exports: computeHash |
| 0.41 | [src/core/llm/provider/factory.ts](./src/core/llm/provider/factory.ts.md) | static | Exports: createProvider |
| 0.41 | [src/core/output/writeIndexNote.ts](./src/core/output/writeIndexNote.ts.md) | static | Exports: writeIndexNote |
| 0.41 | [src/core/output/writeJsonNote.ts](./src/core/output/writeJsonNote.ts.md) | static | Exports: writeJsonNote |
| 0.41 | [src/core/output/writeMarkdownNote.ts](./src/core/output/writeMarkdownNote.ts.md) | static | Exports: writeMarkdownNote |
| 0.41 | [src/core/scanner/scanRepository.ts](./src/core/scanner/scanRepository.ts.md) | static | Exports: scanRepository |
| 0.41 | [src/core/tests/findRelatedTests.ts](./src/core/tests/findRelatedTests.ts.md) | static | Exports: findRelatedTests |
| 0.41 | [tests/fixtures/sampleHook.ts](./tests/fixtures/sampleHook.ts.md) | static | Exports hooks: useImageSearch |
| 0.34 | [src/cli/commands/generate.ts](./src/cli/commands/generate.ts.md) | static | Exports: runGenerate |
| 0.32 | [src/core/output/buildBasicNote.ts](./src/core/output/buildBasicNote.ts.md) | static | Exports: buildBasicNote |
| 0.31 | [src/cli/commands/scan.ts](./src/cli/commands/scan.ts.md) | static | Exports: runScan |
| 0.31 | [src/cli/commands/watch.ts](./src/cli/commands/watch.ts.md) | static | Exports: runWatch |
| 0.31 | [src/core/ast/analyzers/ts/extractComments.ts](./src/core/ast/analyzers/ts/extractComments.ts.md) | static | Exports: extractComments, ExtractedComments |
| 0.31 | [src/core/ast/analyzers/ts/extractExports.ts](./src/core/ast/analyzers/ts/extractExports.ts.md) | static | Exports: extractExports |
| 0.31 | [src/core/ast/analyzers/ts/extractHooks.ts](./src/core/ast/analyzers/ts/extractHooks.ts.md) | static | Exports: extractHooks |
| 0.31 | [src/core/ast/analyzers/ts/extractImports.ts](./src/core/ast/analyzers/ts/extractImports.ts.md) | static | Exports: extractImports, ExtractedImports |
| 0.31 | [src/core/ast/analyzers/ts/extractSymbols.ts](./src/core/ast/analyzers/ts/extractSymbols.ts.md) | static | Exports: extractSymbols |
| 0.31 | [src/core/git/getCoChangedFiles.ts](./src/core/git/getCoChangedFiles.ts.md) | static | Exports: getCoChangedFiles, CoChangedFile |
| 0.31 | [src/core/git/getFileHistory.ts](./src/core/git/getFileHistory.ts.md) | static | Exports: getFileHistory, FileHistory |
| 0.31 | [src/core/git/getGitSignals.ts](./src/core/git/getGitSignals.ts.md) | static | Exports: getGitSignals |
| 0.31 | [src/core/graph/buildDependencyGraph.ts](./src/core/graph/buildDependencyGraph.ts.md) | static | Exports: buildDependencyGraph |
| 0.31 | [src/core/graph/buildReverseDependencyGraph.ts](./src/core/graph/buildReverseDependencyGraph.ts.md) | static | Exports: buildReverseDependencyGraph |
| 0.31 | [src/core/graph/resolveImportPath.ts](./src/core/graph/resolveImportPath.ts.md) | static | Exports: resolveImportPath |
| 0.31 | [src/core/llm/prompts/buildPrompt.ts](./src/core/llm/prompts/buildPrompt.ts.md) | static | Exports: buildPrompt, PromptContext |
| 0.31 | [src/core/llm/schemas/aiNoteSchema.ts](./src/core/llm/schemas/aiNoteSchema.ts.md) | static | Exports: llmNoteSchema, LLMNotePayload |
| 0.31 | [src/core/llm/synthesizeFileNote.ts](./src/core/llm/synthesizeFileNote.ts.md) | static | Exports: synthesizeFileNote |
| 0.31 | [src/core/scanner/discoverFiles.ts](./src/core/scanner/discoverFiles.ts.md) | static | Exports: discoverFiles |
| 0.22 | [src/cli/index.ts](./src/cli/index.ts.md) | static |  |
| 0.21 | [src/core/cache/isCacheValid.ts](./src/core/cache/isCacheValid.ts.md) | static | Exports: isCacheValid |
| 0.21 | [src/core/config/defaults.ts](./src/core/config/defaults.ts.md) | static | Exports: withDefaults, DEFAULT_INCLUDE, DEFAULT_EXCLUDE |
| 0.21 | [src/core/llm/prompts/systemPrompt.ts](./src/core/llm/prompts/systemPrompt.ts.md) | static | Exports: SYSTEM_PROMPT |
| 0.21 | [src/core/llm/provider/anthropic.ts](./src/core/llm/provider/anthropic.ts.md) | static | Exports: AnthropicProvider |
| 0.21 | [src/core/llm/provider/ollama.ts](./src/core/llm/provider/ollama.ts.md) | static | Exports: OllamaProvider |
| 0.21 | [src/core/llm/provider/openai.ts](./src/core/llm/provider/openai.ts.md) | static | Exports: OpenAIProvider |
| 0.21 | [src/core/scanner/ignoreRules.ts](./src/core/scanner/ignoreRules.ts.md) | static | Exports: shouldIgnore |
| 0.21 | [tests/fixtures/sampleModule.ts](./tests/fixtures/sampleModule.ts.md) | static | Exports: loadFile, VERSION, FileLoader |
| 0.12 | [ai-notes.config.ts](./ai-notes.config.ts.md) | static | Exports: default |
