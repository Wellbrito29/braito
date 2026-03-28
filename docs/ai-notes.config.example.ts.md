# Exemplo de Configuração

```ts
export default {
  root: process.cwd(),
  include: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.generated.*',
    '**/coverage/**'
  ],
  domainDocs: [
    'AI_CONTEXT.md',
    'ARCHITECTURE.md',
    'README.md'
  ],
  outputDir: '.ai-notes',
  llm: {
    provider: 'openai',
    model: 'gpt-5'
  },
  publish: {
    sidecarJson: true,
    sidecarMarkdown: true,
    inlineHeaders: false
  }
}
```
