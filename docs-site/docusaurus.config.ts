import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'braito',
  tagline:
    'Structured knowledge sidecars per file — static analysis, git intelligence, and optional LLM synthesis.',
  favicon: 'img/logo.png',

  url: 'https://wellbrito29.github.io',
  baseUrl: '/braito/',

  organizationName: 'wellbrito29',
  projectName: 'braito',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-BR'],
    localeConfigs: {
      en: { label: 'English' },
      'pt-BR': { label: 'Português (Brasil)', htmlLang: 'pt-BR' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'braito',
      logo: {
        alt: 'braito',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'referenceSidebar',
          position: 'left',
          label: 'Reference',
        },
        {
          to: '/docs/changelog',
          label: 'Changelog',
          position: 'left',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/wellbrito29/braito',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Guide',
          items: [
            { label: 'Getting Started', to: '/docs/guide/getting-started' },
            { label: 'Configuration', to: '/docs/guide/configuration' },
            { label: 'MCP Server', to: '/docs/guide/mcp-server' },
          ],
        },
        {
          title: 'Reference',
          items: [
            { label: 'Architecture', to: '/docs/reference/architecture' },
            { label: 'Domain Model', to: '/docs/reference/domain-model' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/wellbrito29/braito' },
            { label: 'Changelog', to: '/docs/changelog' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Wellington Nascimento. MIT License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'json'],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
