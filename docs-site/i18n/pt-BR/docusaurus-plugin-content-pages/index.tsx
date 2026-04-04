import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import Layout from '@theme/Layout'
import styles from '@site/src/pages/index.module.css'

type FeatureItem = {
  emoji: string
  title: string
  description: string
}

const features: FeatureItem[] = [
  {
    emoji: '🔍',
    title: 'Análise estática primeiro',
    description:
      'Extrai imports, exports, assinaturas tipadas, hooks, env vars, chamadas de API e comentários especiais (DECISION, INVARIANT, WHY, HACK) de cada arquivo sem precisar de LLM.',
  },
  {
    emoji: '🧠',
    title: 'LLM na borda de síntese',
    description:
      'O modelo só roda em arquivos acima de um threshold de criticidade. Ele enriquece fatos observados — nunca os substitui. Observado e inferido são sempre mantidos separados.',
  },
  {
    emoji: '📊',
    title: 'Inteligência git',
    description:
      'Score de churn, histórico de commits recentes, arquivos co-modificados e contagem de autores dão contexto histórico a cada nota. Sem anotação manual.',
  },
  {
    emoji: '🔌',
    title: 'Servidor MCP',
    description:
      'Sete ferramentas expõem as notas do braito para assistentes de IA — Cursor, Claude Code ou qualquer cliente MCP. Inclui análise de raio de impacto e busca de texto completo.',
  },
  {
    emoji: '🌐',
    title: 'Interface web local',
    description:
      'SPA com tema escuro, busca, filtro por score e aba Debug com trilha de evidências, breakdown de score e changelog por arquivo.',
  },
  {
    emoji: '🌍',
    title: 'Saída multilíngue',
    description:
      'O conteúdo sintetizado pelo LLM pode ser gerado em qualquer idioma BCP 47. Configure language no arquivo de config ou passe --language na CLI.',
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
  const heroImg = useBaseUrl('/img/braito.png')
  return (
    <Layout
      title="Contexto operacional para codebases"
      description="Sidecars de conhecimento estruturado por arquivo — análise estática, inteligência git e síntese LLM opcional.">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className={clsx('container', styles.heroContainer)}>
          <div className={styles.heroText}>
            <h1 className={clsx('hero__title', styles.heroTitle)}>braito</h1>
            <p className="hero__subtitle">
              Sidecars de conhecimento estruturado por arquivo — análise estática, inteligência git
              e síntese LLM opcional.
            </p>
            <div className={styles.buttons}>
              <Link
                className="button button--secondary button--lg"
                to="/docs/guide/getting-started">
                Começar →
              </Link>
              <Link
                className="button button--outline button--secondary button--lg"
                href="https://github.com/wellbrito29/braito">
                Ver no GitHub
              </Link>
            </div>
          </div>
          <div className={styles.heroImageWrapper}>
            <img src={heroImg} alt="braito preview" className={styles.heroImage} />
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
