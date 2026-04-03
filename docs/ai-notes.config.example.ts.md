# Configuration Example

Full reference for `ai-notes.config.ts` at the project root.

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'

export default {
  // Project root (defaults to process.cwd())
  root: process.cwd(),

  // Files to include — TypeScript/JavaScript only by default
  include: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],

  // Or opt in to Python and Go:
  // include: MULTI_LANGUAGE_INCLUDE,

  // Files to exclude
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.generated.*',
    '**/coverage/**',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],

  // Output directory for .ai-notes/
  output: '.ai-notes',

  // Path to tsconfig.json (auto-detected if omitted)
  tsconfigPath: './tsconfig.json',

  // Notes older than this are flagged as stale
  staleThresholdDays: 30,

  // LLM configuration (optional — omit to use static-only notes)
  llm: {
    // Provider: 'ollama' | 'anthropic' | 'openai'
    provider: 'anthropic',

    // Model name
    model: 'claude-sonnet-4-6',

    // Files with criticalityScore >= llmThreshold are sent to LLM
    llmThreshold: 0.4,

    // Sampling temperature (0–2, lower = more deterministic)
    temperature: 0.2,

    // Per-file synthesis timeout in milliseconds (default: 30000)
    timeoutMs: 30000,

    // Max parallel LLM calls (default: 5)
    concurrency: 5,
  },
}
```

**Security:** API keys must be set via environment variables only:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
```

Never put API keys in `ai-notes.config.ts`.

---

# Exemplo de Configuração

Referência completa para `ai-notes.config.ts` na raiz do projeto.

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'

export default {
  // Raiz do projeto (padrão: process.cwd())
  root: process.cwd(),

  // Arquivos a incluir — apenas TypeScript/JavaScript por padrão
  include: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],

  // Ou ativar suporte a Python e Go:
  // include: MULTI_LANGUAGE_INCLUDE,

  // Arquivos a excluir
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.generated.*',
    '**/coverage/**',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],

  // Diretório de saída para .ai-notes/
  output: '.ai-notes',

  // Caminho para tsconfig.json (detectado automaticamente se omitido)
  tsconfigPath: './tsconfig.json',

  // Notas mais antigas que isso são marcadas como stale
  staleThresholdDays: 30,

  // Configuração do LLM (opcional — omita para usar apenas notas estáticas)
  llm: {
    // Provider: 'ollama' | 'anthropic' | 'openai'
    provider: 'anthropic',

    // Nome do modelo
    model: 'claude-sonnet-4-6',

    // Arquivos com criticalityScore >= llmThreshold são enviados ao LLM
    llmThreshold: 0.4,

    // Temperatura de amostragem (0–2, menor = mais determinístico)
    temperature: 0.2,

    // Timeout de síntese por arquivo em milissegundos (padrão: 30000)
    timeoutMs: 30000,

    // Máximo de chamadas LLM paralelas (padrão: 5)
    concurrency: 5,
  },
}
```

**Segurança:** chaves de API devem ser definidas apenas por variáveis de ambiente:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
```

Nunca coloque chaves de API no `ai-notes.config.ts`.
