import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import styles from './index.module.css'

type FeatureItem = {
  emoji: string
  title: string
  description: string
}

const features: FeatureItem[] = [
  {
    emoji: '🔍',
    title: 'Static analysis first',
    description:
      'Extracts imports, exports, typed signatures, hooks, env vars, API calls, and special comments (DECISION, INVARIANT, WHY, HACK) from every file without touching an LLM.',
  },
  {
    emoji: '🧠',
    title: 'LLM at the synthesis edge',
    description:
      'The model only runs on files above a criticality threshold. It enriches observed facts — never replaces them. Observed and inferred are always kept separate.',
  },
  {
    emoji: '📊',
    title: 'Git intelligence',
    description:
      'Churn score, recent commit history, co-changed files, and author count give every note historical context. No manual annotation required.',
  },
  {
    emoji: '🔌',
    title: 'MCP server',
    description:
      'Seven tools expose braito notes to AI assistants — Cursor, Claude Code, or any MCP-compatible client. Includes blast-radius analysis and full-text search.',
  },
  {
    emoji: '🌐',
    title: 'Local web UI',
    description:
      'Built-in dark-theme SPA with search, score filtering, and a Debug tab showing evidence trails, score breakdown, and per-file changelog.',
  },
  {
    emoji: '🌍',
    title: 'Multi-language output',
    description:
      'LLM-synthesized content can be generated in any BCP 47 language. Set language in config or pass --language on the CLI.',
  },
]

function Feature({ emoji, title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <p className={styles.featureEmoji}>{emoji}</p>
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout
      title="Operational context for codebases"
      description="Structured knowledge sidecars per file — static analysis, git intelligence, and optional LLM synthesis.">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className={clsx('hero__title', styles.heroTitle)}>braito</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="/docs/guide/getting-started">
              Get Started →
            </Link>
            <Link
              className="button button--outline button--secondary button--lg margin-left--md"
              href="https://github.com/wellbrito29/braito">
              View on GitHub
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {features.map((props) => (
                <Feature key={props.title} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
