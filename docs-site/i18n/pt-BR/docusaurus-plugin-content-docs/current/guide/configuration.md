---
sidebar_position: 2
---

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
    // Provider: 'ollama' | 'anthropic' | 'openai' | 'claude-cli'
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

### Claude CLI (usa sua sessão do Claude Code, sem chave de API)

Dispara o binário local `claude` em modo print (`claude -p --output-format json`). Autentica com a conta logada no Claude Code — não requer `ANTHROPIC_API_KEY`.

```bash
# Certifique-se de que `claude` está no PATH (veja https://docs.claude.com/pt/docs/claude-code)
claude --version
```

```ts
llm: { provider: 'claude-cli', model: 'claude-sonnet-4-6', llmThreshold: 0.4 }
```

:::warning[Segurança]
Chaves de API devem ser definidas apenas por variáveis de ambiente. Nunca coloque-as no `ai-notes.config.ts`.
O provider `claude-cli` dispensa a chave de API — ele autentica via sua sessão local do Claude Code.
:::

## Constituição do projeto

Crie um arquivo `braito.context.md` na raiz do projeto para injetar conhecimento específico em cada prompt de síntese LLM. É opcional — o pipeline funciona identicamente sem ele.

```markdown
# Contexto do Meu Projeto

## Vocabulário de domínio

- **note** — o artefato principal gerado por arquivo
- **pipeline** — a cadeia completa de análise + síntese

## Restrições arquiteturais

- O LLM só é chamado na borda de síntese — as camadas de análise e grafo são livres de LLM
- Todos os providers são trocáveis via factory.ts

## Áreas de risco

- Mudanças no tipo principal de schema podem exigir um bump de versão
- Mudanças no system prompt afetam a qualidade de todo output LLM

## Notas de testes

- Execute os testes com `bun test`
- Testes e2e usam diretórios temporários reais
```

Quando presente, o braito lê esse arquivo (limitado a 4 000 caracteres) e acrescenta uma seção `## Project context` ao system prompt do LLM. O modelo usa isso para:

- Aplicar o vocabulário de domínio correto (ex: nunca usar "documento" quando o time chama de "note")
- Respeitar as restrições arquiteturais ao inferir propósito e armadilhas
- Destacar as áreas de risco certas em `knownPitfalls` e `sensitiveDependencies`

:::tip
Mantenha esse arquivo com menos de 4 000 caracteres. Conteúdo mais longo é truncado antes de ser enviado ao LLM.
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
