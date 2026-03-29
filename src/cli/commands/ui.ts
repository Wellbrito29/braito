import path from 'node:path'
import fs from 'node:fs'
import { loadConfig } from '../../core/config/loadConfig.ts'
import { logger } from '../../core/utils/logger.ts'

const DEFAULT_PORT = 7842

export async function runUi(args: { root?: string; port?: number }): Promise<void> {
  const root = path.resolve(args.root ?? process.cwd())
  const config = await loadConfig(root)
  const notesDir = path.resolve(root, config.output)
  const port = args.port ?? DEFAULT_PORT

  if (!fs.existsSync(notesDir)) {
    logger.warn(`No .ai-notes/ directory found at ${notesDir}. Run 'generate' first.`)
    process.exit(1)
  }

  const server = Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url)

      // API: GET /api/index
      if (url.pathname === '/api/index') {
        return serveJson(path.join(notesDir, 'index.json'))
      }

      // API: GET /api/note?path=src/foo.ts
      if (url.pathname === '/api/note') {
        const filePath = url.searchParams.get('path')
        if (!filePath) return new Response('Missing ?path=', { status: 400 })
        return serveJson(path.join(notesDir, filePath + '.json'))
      }

      // UI: everything else serves the SPA shell
      return new Response(renderHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    },
  })

  logger.success(`braito UI running at http://localhost:${server.port}`)
  logger.info(`Serving notes from ${notesDir}`)
  logger.info('Press Ctrl+C to stop.')

  // Keep alive
  await new Promise(() => {})
}

function serveJson(filePath: string): Response {
  if (!fs.existsSync(filePath)) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return new Response(content, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Read error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function renderHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>braito — AI Notes</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#0f0f0f;color:#e0e0e0;min-height:100vh}
    header{padding:16px 24px;border-bottom:1px solid #222;display:flex;align-items:center;gap:12px}
    h1{font-size:18px;font-weight:600;color:#fff}
    .subtitle{font-size:13px;color:#666}
    .container{display:grid;grid-template-columns:340px 1fr;height:calc(100vh - 53px)}
    .sidebar{border-right:1px solid #222;overflow-y:auto;padding:12px}
    .search{width:100%;padding:8px 10px;background:#1a1a1a;border:1px solid #333;border-radius:6px;color:#e0e0e0;font-size:13px;margin-bottom:12px;outline:none}
    .search:focus{border-color:#555}
    .domain-group{margin-bottom:16px}
    .domain-label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.05em;padding:0 4px 6px;border-bottom:1px solid #1e1e1e;margin-bottom:6px}
    .file-item{padding:7px 8px;border-radius:5px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px}
    .file-item:hover{background:#1a1a1a}
    .file-item.active{background:#1e2a3a;border-left:2px solid #4a9eff}
    .file-name{font-size:12px;color:#ccc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
    .score{font-size:11px;font-weight:600;padding:2px 6px;border-radius:10px;white-space:nowrap}
    .score-high{background:#3a1a1a;color:#ff6b6b}
    .score-mid{background:#2a2a1a;color:#ffd93d}
    .score-low{background:#1a2a1a;color:#6bcb77}
    .stale-badge{font-size:10px;color:#f0a500}
    .detail{overflow-y:auto;padding:24px}
    .detail h2{font-size:16px;color:#fff;margin-bottom:4px}
    .detail .meta{font-size:12px;color:#666;margin-bottom:20px}
    .section{margin-bottom:20px}
    .section h3{font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #1e1e1e}
    .item{font-size:13px;color:#ccc;padding:4px 0;padding-left:12px;border-left:2px solid #333;margin-bottom:4px}
    .inferred{font-size:12px;color:#888;font-style:italic;padding:4px 0 4px 12px;border-left:2px solid #2a3a2a;margin-bottom:4px}
    .empty-state{text-align:center;padding:80px 24px;color:#444}
    .empty-state p{font-size:14px}
    .filter-bar{display:flex;gap:8px;margin-bottom:12px;align-items:center}
    .filter-label{font-size:12px;color:#666;white-space:nowrap}
    select{background:#1a1a1a;border:1px solid #333;color:#ccc;padding:4px 8px;border-radius:4px;font-size:12px}
  </style>
</head>
<body>
  <header>
    <h1>braito</h1>
    <span class="subtitle">AI Notes</span>
  </header>
  <div class="container">
    <div class="sidebar">
      <input class="search" id="search" placeholder="Search files..." />
      <div class="filter-bar">
        <span class="filter-label">Min score:</span>
        <select id="scoreFilter">
          <option value="0">All</option>
          <option value="0.3">0.3+</option>
          <option value="0.5" selected>0.5+</option>
          <option value="0.7">0.7+</option>
        </select>
      </div>
      <div id="fileList">Loading...</div>
    </div>
    <div class="detail" id="detail">
      <div class="empty-state"><p>Select a file to view its AI note</p></div>
    </div>
  </div>
  <script>
    let index = null
    let selected = null

    async function loadIndex() {
      const res = await fetch('/api/index')
      index = await res.json()
      renderList()
    }

    function scoreClass(s) {
      if (s >= 0.7) return 'score-high'
      if (s >= 0.4) return 'score-mid'
      return 'score-low'
    }

    function renderList() {
      const q = document.getElementById('search').value.toLowerCase()
      const minScore = parseFloat(document.getElementById('scoreFilter').value)
      const entries = (index.entries || [])
        .filter(e => e.criticalityScore >= minScore)
        .filter(e => !q || e.relativePath.toLowerCase().includes(q))

      const groups = {}
      for (const e of entries) {
        if (!groups[e.domain]) groups[e.domain] = []
        groups[e.domain].push(e)
      }

      const sortedDomains = Object.keys(groups).sort((a, b) => {
        const maxA = Math.max(...groups[a].map(e => e.criticalityScore))
        const maxB = Math.max(...groups[b].map(e => e.criticalityScore))
        return maxB - maxA
      })

      const list = document.getElementById('fileList')
      if (!sortedDomains.length) { list.innerHTML = '<div style="color:#444;font-size:13px;padding:8px">No files match</div>'; return }

      list.innerHTML = sortedDomains.map(domain => \`
        <div class="domain-group">
          <div class="domain-label">\${domain}</div>
          \${groups[domain].map(e => \`
            <div class="file-item \${selected === e.relativePath ? 'active' : ''}"
                 onclick="loadNote('\${e.relativePath}')">
              <span class="file-name" title="\${e.relativePath}">\${e.relativePath.split('/').pop()}</span>
              \${e.stale ? '<span class="stale-badge">⚠</span>' : ''}
              <span class="score \${scoreClass(e.criticalityScore)}">\${e.criticalityScore.toFixed(2)}</span>
            </div>
          \`).join('')}
        </div>
      \`).join('')
    }

    async function loadNote(relPath) {
      selected = relPath
      renderList()
      const res = await fetch('/api/note?path=' + encodeURIComponent(relPath))
      const note = await res.json()
      if (note.error) { document.getElementById('detail').innerHTML = '<div class="empty-state"><p>Note not found</p></div>'; return }
      renderDetail(note, relPath)
    }

    function renderField(title, field) {
      if (!field || (!field.observed.length && !field.inferred.length)) return ''
      const obs = field.observed.map(o => \`<div class="item">\${o}</div>\`).join('')
      const inf = field.inferred.length ? field.inferred.map(i => \`<div class="inferred">↳ \${i}</div>\`).join('') : ''
      return \`<div class="section"><h3>\${title}</h3>\${obs}\${inf}</div>\`
    }

    function renderDetail(note, relPath) {
      const date = new Date(note.generatedAt).toISOString().slice(0,10)
      document.getElementById('detail').innerHTML = \`
        <h2>\${relPath}</h2>
        <div class="meta">Score: \${note.criticalityScore.toFixed(2)} · Model: \${note.model} · \${date}</div>
        \${renderField('Purpose', note.purpose)}
        \${renderField('Invariants', note.invariants)}
        \${renderField('Important Decisions', note.importantDecisions)}
        \${renderField('Known Pitfalls', note.knownPitfalls)}
        \${renderField('Sensitive Dependencies', note.sensitiveDependencies)}
        \${renderField('Impact Validation', note.impactValidation)}
      \`
    }

    document.getElementById('search').addEventListener('input', renderList)
    document.getElementById('scoreFilter').addEventListener('change', renderList)
    loadIndex()
  </script>
</body>
</html>`
}
