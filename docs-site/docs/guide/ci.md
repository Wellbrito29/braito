---
sidebar_position: 6
---

# CI Integration

braito ships a ready-to-use GitHub Actions workflow.

## Setup

The workflow file is at `.github/workflows/ai-notes.yml`. It triggers on push to `main`/`master` when source files change.

```yaml
name: braito — generate AI notes

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
          fetch-depth: 0          # required for accurate git signals

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - name: Generate AI notes
        run: bun src/cli/index.ts generate --root ./
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          # OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Commit updated notes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: update AI notes'
          file_pattern: '.ai-notes/**'
```

:::warning[Full git history required]
The workflow must use `fetch-depth: 0`. Without it, git signals (churn score, co-changes, author count) will be inaccurate or empty.
:::

## Secrets

Add your provider API key as a repository secret:

- `ANTHROPIC_API_KEY` for Anthropic
- `OPENAI_API_KEY` for OpenAI

Go to **Settings → Secrets and variables → Actions** in your GitHub repository.

## Static-only mode

If you do not configure an LLM provider, braito runs in static-only mode — all notes are generated from code analysis and git history, with no API calls. This works in CI with no secrets required.

```bash
bun src/cli/index.ts generate --root ./
# runs fine with no API key set
```
