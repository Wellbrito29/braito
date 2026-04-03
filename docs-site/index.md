---
layout: home

hero:
  name: braito
  text: Operational context for codebases
  tagline: Structured knowledge sidecars per file — static analysis, git intelligence, and optional LLM synthesis. Built for TypeScript/JavaScript monorepos.
  image:
    src: /logo.png
    alt: braito
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/wellbrito29/braito

features:
  - icon: 🔍
    title: Static analysis first
    details: Extracts imports, exports, typed signatures, hooks, env vars, API calls, and special comments (DECISION, INVARIANT, WHY, HACK) from every file without touching an LLM.

  - icon: 🧠
    title: LLM at the synthesis edge
    details: The model only runs on files above a criticality threshold. It enriches observed facts — never replaces them. Observed and inferred are always kept separate.

  - icon: 📊
    title: Git intelligence
    details: Churn score, recent commit history, co-changed files, and author count give every note historical context. No manual annotation required.

  - icon: 🔌
    title: MCP server
    details: Seven tools expose braito notes to AI assistants — Cursor, Claude Code, or any MCP-compatible client. Includes blast-radius analysis and full-text search.

  - icon: 🌐
    title: Local web UI
    details: Built-in dark-theme SPA with search, score filtering, and a Debug tab showing evidence trails, score breakdown, and per-file changelog.

  - icon: 🌍
    title: Multi-language output
    details: LLM-synthesized content can be generated in any BCP 47 language. Set language in config or pass --language on the CLI.
---
