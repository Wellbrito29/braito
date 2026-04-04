import { defineConfig } from 'vitepress'

const enNav = [
  { text: 'Guide', link: '/guide/getting-started' },
  { text: 'Reference', link: '/reference/architecture' },
  { text: 'Changelog', link: '/changelog' },
  { text: 'GitHub', link: 'https://github.com/wellbrito29/braito' },
]

const ptNav = [
  { text: 'Guia', link: '/pt/guide/getting-started' },
  { text: 'Referência', link: '/pt/reference/architecture' },
  { text: 'Changelog', link: '/pt/changelog' },
  { text: 'GitHub', link: 'https://github.com/wellbrito29/braito' },
]

const enSidebar = [
  {
    text: 'Guide',
    items: [
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Configuration', link: '/guide/configuration' },
      { text: 'MCP Server', link: '/guide/mcp-server' },
      { text: 'Web UI', link: '/guide/web-ui' },
      { text: 'Watch Mode', link: '/guide/watch-mode' },
      { text: 'CI Integration', link: '/guide/ci' },
      { text: 'Agent Slash Commands', link: '/guide/agent-commands' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'Architecture', link: '/reference/architecture' },
      { text: 'Domain Model & Schema', link: '/reference/domain-model' },
      { text: 'LLM Strategy', link: '/reference/llm-strategy' },
      { text: 'File Structure', link: '/reference/file-structure' },
      { text: 'Recommendations', link: '/reference/recommendations' },
    ],
  },
]

const ptSidebar = [
  {
    text: 'Guia',
    items: [
      { text: 'Início Rápido', link: '/pt/guide/getting-started' },
      { text: 'Configuração', link: '/pt/guide/configuration' },
      { text: 'Servidor MCP', link: '/pt/guide/mcp-server' },
      { text: 'Interface Web', link: '/pt/guide/web-ui' },
      { text: 'Modo Watch', link: '/pt/guide/watch-mode' },
      { text: 'Integração CI', link: '/pt/guide/ci' },
      { text: 'Slash Commands para Agentes', link: '/pt/guide/agent-commands' },
    ],
  },
  {
    text: 'Referência',
    items: [
      { text: 'Arquitetura', link: '/pt/reference/architecture' },
      { text: 'Modelo de Domínio', link: '/pt/reference/domain-model' },
      { text: 'Estratégia LLM', link: '/pt/reference/llm-strategy' },
      { text: 'Estrutura de Arquivos', link: '/pt/reference/file-structure' },
      { text: 'Recomendações', link: '/pt/reference/recommendations' },
    ],
  },
]

export default defineConfig({
  title: 'braito',
  description: 'Operational context for codebases — structured AI knowledge sidecars per file.',
  base: '/braito/',

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/braito/logo.png' }],
    ['meta', { property: 'og:title', content: 'braito — Operational context for codebases' }],
    ['meta', { property: 'og:description', content: 'Structured AI knowledge sidecars per file. Static analysis + git intelligence + optional LLM synthesis.' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
      },
    },
    pt: {
      label: 'Português',
      lang: 'pt-BR',
      themeConfig: {
        nav: ptNav,
        sidebar: ptSidebar,
      },
    },
  },

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'braito',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wellbrito29/braito' },
    ],

    footer: {
      message: 'Licença MIT.',
      copyright: 'Copyright © 2025–present Wellington Nascimento',
    },

    search: {
      provider: 'local',
    },
  },
})
