import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  guideSidebar: [
    {
      type: 'category',
      label: 'Guide',
      collapsible: false,
      items: [
        'guide/getting-started',
        'guide/configuration',
        'guide/mcp-server',
        'guide/web-ui',
        'guide/watch-mode',
        'guide/ci',
        'guide/agent-commands',
      ],
    },
  ],
  referenceSidebar: [
    {
      type: 'category',
      label: 'Reference',
      collapsible: false,
      items: [
        'reference/architecture',
        'reference/domain-model',
        'reference/llm-strategy',
        'reference/file-structure',
        'reference/recommendations',
      ],
    },
  ],
}

export default sidebars
