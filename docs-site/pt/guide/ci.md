# Integração CI

O braito inclui um workflow GitHub Actions pronto para uso.

## Configuração

O arquivo de workflow está em `.github/workflows/ai-notes.yml`. Ele é acionado em push para `main`/`master` quando arquivos fonte mudam.

```yaml
name: braito — gerar notas de IA

on:
  push:
    branches: [main, master]
    paths:
      - 'src/**'
      - 'ai-notes.config.ts'

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0          # obrigatório para sinais git precisos

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - name: Gerar notas de IA
        run: bun src/cli/index.ts generate --root ./
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          # OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Commitar notas atualizadas
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: atualizar notas de IA'
          file_pattern: '.ai-notes/**'
```

::: warning Histórico git completo obrigatório
O workflow deve usar `fetch-depth: 0`. Sem isso, os sinais git (churn score, co-mudanças, contagem de autores) serão imprecisos ou vazios.
:::

## Secrets

Adicione sua chave de API como secret do repositório:

- `ANTHROPIC_API_KEY` para Anthropic
- `OPENAI_API_KEY` para OpenAI

Acesse **Settings → Secrets and variables → Actions** no seu repositório GitHub.

## Modo estático (sem LLM)

Se você não configurar um provider LLM, o braito roda em modo estático — todas as notas são geradas a partir de análise de código e histórico git, sem chamadas de API. Funciona em CI sem precisar de secrets.

```bash
bun src/cli/index.ts generate --root ./
# roda normalmente sem nenhuma chave de API definida
```
