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
        const resolved = path.resolve(notesDir, filePath + '.json')
        const notesDirNorm = path.normalize(notesDir) + path.sep
        if (!path.normalize(resolved).startsWith(notesDirNorm)) {
          return new Response(JSON.stringify({ error: 'Access denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return serveJson(resolved)
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
    .detail .meta{font-size:12px;color:#666;margin-bottom:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .tab-bar{display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid #222;padding-bottom:0}
    .tab{padding:6px 14px;font-size:12px;cursor:pointer;color:#666;border-bottom:2px solid transparent;margin-bottom:-1px}
    .tab:hover{color:#ccc}
    .tab.active{color:#4a9eff;border-bottom-color:#4a9eff}
    .section{margin-bottom:20px}
    .section h3{font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #1e1e1e}
    .item{font-size:13px;color:#ccc;padding:4px 0;padding-left:12px;border-left:2px solid #333;margin-bottom:4px}
    .inferred{font-size:12px;color:#888;font-style:italic;padding:4px 0 4px 12px;border-left:2px solid #2a3a2a;margin-bottom:4px}
    .evidence-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
    .evidence-table th{text-align:left;color:#555;font-weight:500;padding:4px 8px;border-bottom:1px solid #1e1e1e}
    .evidence-table td{padding:4px 8px;color:#999;border-bottom:1px solid #141414;vertical-align:top}
    .evidence-table td:first-child{color:#4a9eff;white-space:nowrap;width:60px}
    .badge{font-size:10px;padding:1px 6px;border-radius:8px;font-weight:600;white-space:nowrap}
    .badge-code{background:#1a2a3a;color:#4a9eff}
    .badge-git{background:#1e2a1a;color:#6bcb77}
    .badge-test{background:#2a1a2a;color:#c77bff}
    .badge-graph{background:#2a2a1a;color:#ffd93d}
    .badge-comment{background:#2a1a1a;color:#ff8080}
    .badge-doc{background:#1a1a2a;color:#a0a0ff}
    .changelog-entry{padding:5px 0;border-bottom:1px solid #141414;font-size:12px;display:flex;gap:8px;align-items:baseline}
    .changelog-hash{font-family:monospace;color:#4a9eff;font-size:11px;white-space:nowrap}
    .changelog-date{color:#555;font-size:11px;white-space:nowrap}
    .changelog-msg{color:#ccc;flex:1}
    .changelog-author{color:#555;font-size:11px;white-space:nowrap}
    .debug-kv{font-size:12px;color:#888;padding:3px 0}
    .debug-kv span{color:#ccc}
    .debug-section{margin-bottom:16px}
    .debug-section h4{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
    .score-bar-wrap{margin-bottom:8px}
    .score-bar-label{font-size:12px;color:#888;display:flex;justify-content:space-between;margin-bottom:3px}
    .score-bar{height:4px;background:#1e1e1e;border-radius:2px;overflow:hidden}
    .score-bar-fill{height:100%;border-radius:2px;background:#4a9eff}
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
    let activeTab = 'note'

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
      const obs = field.observed.map(o => \`<div class="item">\${escHtml(o)}</div>\`).join('')
      const inf = field.inferred.length ? field.inferred.map(i => \`<div class="inferred">↳ \${escHtml(i)}</div>\`).join('') : ''
      return \`<div class="section"><h3>\${title}</h3>\${obs}\${inf}</div>\`
    }

    function escHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    }

    function badgeClass(type) {
      return 'badge badge-' + (type || 'code')
    }

    function renderEvidenceSection(note) {
      const fields = ['purpose','invariants','sensitiveDependencies','importantDecisions','knownPitfalls','impactValidation']
      const fieldLabels = {purpose:'Purpose',invariants:'Invariants',sensitiveDependencies:'Sensitive Deps',importantDecisions:'Decisions',knownPitfalls:'Pitfalls',impactValidation:'Impact'}
      let html = ''
      for (const f of fields) {
        const field = note[f]
        if (!field || !field.evidence || field.evidence.length === 0) continue
        html += \`<div class="debug-section"><h4>\${fieldLabels[f]} — \${field.evidence.length} evidence item(s), confidence \${field.confidence.toFixed(2)}</h4>
          <table class="evidence-table"><thead><tr><th>Type</th><th>Detail</th></tr></thead><tbody>
          \${field.evidence.map(e => \`<tr><td><span class="\${badgeClass(e.type)}">\${e.type}</span></td><td>\${escHtml(e.detail)}</td></tr>\`).join('')}
          </tbody></table></div>\`
      }
      return html || '<div style="color:#444;font-size:13px">No evidence items recorded.</div>'
    }

    function renderChangelog(recentChanges) {
      if (!recentChanges || recentChanges.length === 0) return '<div style="color:#444;font-size:13px">No git history available.</div>'
      return recentChanges.map(c => \`
        <div class="changelog-entry">
          <span class="changelog-hash">\${c.hash.slice(0,7)}</span>
          <span class="changelog-date">\${c.date.slice(0,10)}</span>
          <span class="changelog-msg">\${escHtml(c.message)}</span>
          <span class="changelog-author">\${escHtml(c.author)}</span>
        </div>
      \`).join('')
    }

    function renderScoreBreakdown(note) {
      const score = note.criticalityScore
      const fields = [
        {label:'Purpose entries', val: note.purpose?.observed.length ?? 0, max:5},
        {label:'Invariants', val: note.invariants?.observed.length ?? 0, max:3},
        {label:'Known pitfalls', val: note.knownPitfalls?.observed.length ?? 0, max:5},
        {label:'Sensitive deps', val: note.sensitiveDependencies?.observed.length ?? 0, max:5},
        {label:'Impact targets', val: note.impactValidation?.observed.length ?? 0, max:5},
        {label:'Decisions', val: note.importantDecisions?.observed.length ?? 0, max:3},
        {label:'Changelog entries', val: (note.recentChanges || []).length, max:10},
      ]
      const bars = fields.map(f => {
        const pct = Math.min(f.val / f.max * 100, 100).toFixed(0)
        return \`<div class="score-bar-wrap">
          <div class="score-bar-label"><span>\${f.label}</span><span>\${f.val}</span></div>
          <div class="score-bar"><div class="score-bar-fill" style="width:\${pct}%"></div></div>
        </div>\`
      }).join('')
      return \`<div class="debug-section">
        <h4>Criticality score: \${score.toFixed(2)}</h4>
        \${bars}
      </div>\`
    }

    function renderDebugTab(note) {
      return \`
        \${renderScoreBreakdown(note)}
        <div class="debug-section">
          <h4>Evidence trail</h4>
          \${renderEvidenceSection(note)}
        </div>
        <div class="debug-section">
          <h4>Changelog (\${(note.recentChanges||[]).length} commits)</h4>
          \${renderChangelog(note.recentChanges)}
        </div>
      \`
    }

    function renderNoteTab(note) {
      return \`
        \${renderField('Purpose', note.purpose)}
        \${renderField('Invariants', note.invariants)}
        \${renderField('Important Decisions', note.importantDecisions)}
        \${renderField('Known Pitfalls', note.knownPitfalls)}
        \${renderField('Sensitive Dependencies', note.sensitiveDependencies)}
        \${renderField('Impact Validation', note.impactValidation)}
      \`
    }

    function switchTab(tab, note) {
      activeTab = tab
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab))
      document.getElementById('tab-content').innerHTML = tab === 'debug' ? renderDebugTab(note) : renderNoteTab(note)
    }

    function renderDetail(note, relPath) {
      const date = new Date(note.generatedAt).toISOString().slice(0,10)
      const changeCount = (note.recentChanges || []).length
      document.getElementById('detail').innerHTML = \`
        <h2>\${escHtml(relPath)}</h2>
        <div class="meta">
          <span>Score: <strong>\${note.criticalityScore.toFixed(2)}</strong></span>
          <span>Model: \${note.model}</span>
          <span>\${date}</span>
          \${changeCount > 0 ? '<span>' + changeCount + ' commits</span>' : ''}
        </div>
        <div class="tab-bar">
          <div class="tab \${activeTab==='note'?'active':''}" data-tab="note" onclick="switchTab('note', currentNote)">Note</div>
          <div class="tab \${activeTab==='debug'?'active':''}" data-tab="debug" onclick="switchTab('debug', currentNote)">Debug</div>
        </div>
        <div id="tab-content"></div>
      \`
      window.currentNote = note
      document.getElementById('tab-content').innerHTML = activeTab === 'debug' ? renderDebugTab(note) : renderNoteTab(note)
    }

    document.getElementById('search').addEventListener('input', renderList)
    document.getElementById('scoreFilter').addEventListener('change', renderList)
    loadIndex()
  </script>
</body>
</html>`
}
