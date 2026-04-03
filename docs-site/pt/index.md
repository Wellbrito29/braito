---
layout: home

hero:
  name: braito
  text: Contexto operacional para codebases
  tagline: Sidecars de conhecimento estruturado por arquivo — análise estática, inteligência git e síntese LLM opcional. Feito para monorepos TypeScript/JavaScript.
  image:
    src: /logo.png
    alt: braito
  actions:
    - theme: brand
      text: Começar
      link: /pt/guide/getting-started
    - theme: alt
      text: Ver no GitHub
      link: https://github.com/wellbrito29/braito

features:
  - icon: 🔍
    title: Análise estática primeiro
    details: Extrai imports, exports, assinaturas tipadas, hooks, env vars, chamadas de API e comentários especiais (DECISION, INVARIANT, WHY, HACK) de cada arquivo sem precisar de LLM.

  - icon: 🧠
    title: LLM na borda de síntese
    details: O modelo só roda em arquivos acima de um threshold de criticidade. Ele enriquece fatos observados — nunca os substitui. Observado e inferido são sempre mantidos separados.

  - icon: 📊
    title: Inteligência git
    details: Score de churn, histórico de commits, arquivos co-modificados e contagem de autores dão contexto histórico a cada nota. Sem anotação manual.

  - icon: 🔌
    title: Servidor MCP
    details: Sete ferramentas expõem as notas do braito para assistentes de IA — Cursor, Claude Code ou qualquer cliente MCP. Inclui análise de raio de impacto e busca de texto completo.

  - icon: 🌐
    title: Interface web local
    details: SPA com tema escuro, busca, filtro por score e aba Debug com trilha de evidências, breakdown de score e changelog por arquivo.

  - icon: 🌍
    title: Saída multilíngue
    details: O conteúdo sintetizado pelo LLM pode ser gerado em qualquer idioma BCP 47. Configure language no arquivo de config ou passe --language na CLI.
---
