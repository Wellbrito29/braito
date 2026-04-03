# Configuração

Crie `ai-notes.config.ts` na raiz do seu projeto. Todos os campos são opcionais.

```ts
import { MULTI_LANGUAGE_INCLUDE } from './src/core/config/defaults.ts'

export default {
  // ─── Escopo ───────────────────────────────────────────────────────────────

  // Arquivos a incluir (TypeScript/JavaScript por padrão)
  include: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],

  // Opt-in para Python e Go:
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

  // ─── Saída ────────────────────────────────────────────────────────────────

  // Diretório para as notas geradas (padrão: '.ai-notes')
  output: '.ai-notes',

  // Caminho para o tsconfig.json (detectado automaticamente se omitido)
  tsconfigPath: './tsconfig.json',

  // Notas mais antigas que isso são marcadas como stale no índice
  staleThresholdDays: 30,

  // ─── Idioma ───────────────────────────────────────────────────────────────

  // Tag BCP 47 para o conteúdo sintetizado pelo LLM (padrão: 'en')
  // A flag --language na CLI sobrepõe esse valor.
  language: 'pt-BR',

  // ─── LLM ──────────────────────────────────────────────────────────────────

  llm: {
    // Provider: 'ollama' | 'anthropic' | 'openai'
    provider: 'anthropic',

    // Nome do modelo
    model: 'claude-sonnet-4-6',

    // Apenas arquivos com criticalityScore >= esse threshold são enviados ao LLM
    llmThreshold: 0.4,

    // Temperatura de amostragem (menor = mais determinístico)
    temperature: 0.2,

    // Timeout por arquivo em milissegundos
    timeoutMs: 30000,

    // Máximo de chamadas paralelas ao LLM
    concurrency: 5,
  },
}
```

## Configuração de providers

### Anthropic

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

```ts
llm: { provider: 'anthropic', model: 'claude-sonnet-4-6', llmThreshold: 0.4 }
```

### OpenAI

```bash
export OPENAI_API_KEY=sk-...
```

```ts
llm: { provider: 'openai', model: 'gpt-4o', llmThreshold: 0.4 }
```

### Ollama (local, sem chave de API)

```bash
ollama pull llama3
```

```ts
llm: { provider: 'ollama', model: 'llama3', llmThreshold: 0.4, temperature: 0.2 }
```

::: warning Segurança
Chaves de API devem ser definidas apenas por variáveis de ambiente. Nunca coloque-as no `ai-notes.config.ts`.
:::

## Saída multilíngue

O campo `language` controla o idioma de todo o conteúdo sintetizado pelo LLM (arrays `inferred[]` e detalhes de evidência). A flag CLI tem prioridade sobre o config:

```bash
# Saída em espanhol
bun src/cli/index.ts generate --root ./ --language es

# Saída em português do Brasil
bun src/cli/index.ts generate --root ./ --language pt-BR
```

Suportado: qualquer tag BCP 47 válida (`en`, `pt-BR`, `es`, `fr`, `de`, `ja`, etc.).

## Score de criticidade

O `criticalityScore` (0–1) é calculado a partir de sinais estáticos:

| Sinal | Contribuição máxima |
|---|---|
| Quantidade de dependentes reversos | +0.40 |
| Exporta hooks React/Vue | +0.20 |
| Imports externos | +0.10 |
| Uso de variáveis de ambiente | +0.10 |
| Chamadas de API externas | +0.10 |
| Sem testes (+ tem consumidores) | +0.15 |
| Alto churn (commits git) | +0.15 |
| Comentários TODO/FIXME/HACK | +0.05 |
| Múltiplos autores | +0.05 |

Arquivos acima do `llmThreshold` são enviados ao LLM. Os demais recebem uma nota estática rápida.
