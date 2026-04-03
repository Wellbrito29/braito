import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'braito',
  description: 'Operational context for codebases — structured AI knowledge sidecars per file.',
  base: '/braito/',

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/braito/logo.png' }],
    ['meta', { property: 'og:title', content: 'braito — Operational context for codebases' }],
    ['meta', { property: 'og:description', content: 'Structured AI knowledge sidecars per file. Static analysis + git intelligence + optional LLM synthesis.' }],
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'braito',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/architecture' },
      { text: 'GitHub', link: 'https://github.com/wellbrito29/braito' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'MCP Server', link: '/guide/mcp-server' },
          { text: 'Web UI', link: '/guide/web-ui' },
          { text: 'Watch Mode', link: '/guide/watch-mode' },
          { text: 'CI Integration', link: '/guide/ci' },
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
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wellbrito29/braito' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025–present Wellington Nascimento',
    },

    search: {
      provider: 'local',
    },
  },
})
