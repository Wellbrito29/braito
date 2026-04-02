import path from 'node:path'
import fs from 'node:fs'
import { loadConfig } from '../../core/config/loadConfig.ts'
import { logger } from '../../core/utils/logger.ts'
import type { TraceEvent } from '../../core/llm/trace.ts'

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

      // API: GET /api/overview
      if (url.pathname === '/api/overview') {
        return serveJson(path.join(notesDir, 'overview.json'))
      }

      // API: GET /api/index
      if (url.pathname === '/api/index') {
        return serveJson(path.join(notesDir, 'index.json'))
      }

      // API: GET /api/llm-events — SSE stream of LLM trace events
      if (url.pathname === '/api/llm-events') {
        const traceFile = path.join(notesDir, '.llm-trace.jsonl')
        let offset = 0
        const stream = new ReadableStream({
          start(controller) {
            const send = () => {
              if (!fs.existsSync(traceFile)) return
              const stat = fs.statSync(traceFile)
              if (stat.size <= offset) return
              const buf = Buffer.alloc(stat.size - offset)
              const fd = fs.openSync(traceFile, 'r')
              fs.readSync(fd, buf, 0, buf.length, offset)
              fs.closeSync(fd)
              offset = stat.size
              const lines = buf.toString('utf-8').split('\n').filter(Boolean)
              for (const line of lines) {
                controller.enqueue(new TextEncoder().encode(`data: ${line}\n\n`))
              }
            }
            send()
            const interval = setInterval(send, 800)
            // Clean up when client disconnects
            const cleanup = () => clearInterval(interval)
            req.signal?.addEventListener('abort', cleanup)
          },
        })
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          },
        })
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
    .file-summary{font-size:11px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 8px 5px 8px}
    .detail-summary{font-size:14px;color:#aaa;margin-bottom:20px;line-height:1.5;padding:12px;background:#141414;border-radius:6px;border-left:3px solid #333}
    .overview-btn{padding:6px 14px;background:#1a1a1a;border:1px solid #333;color:#888;border-radius:5px;font-size:12px;cursor:pointer;margin-bottom:12px;width:100%;text-align:left}
    .overview-btn:hover{background:#222;color:#ccc}
    .overview-description{font-size:14px;color:#bbb;line-height:1.6;padding:14px;background:#141414;border-radius:6px;border-left:3px solid #4a9eff;margin-bottom:20px}
    .stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
    .stat-card{background:#141414;border:1px solid #1e1e1e;border-radius:6px;padding:12px;text-align:center}
    .stat-value{font-size:22px;font-weight:700;color:#fff}
    .stat-label{font-size:11px;color:#555;margin-top:4px}
    .overview-table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px}
    .overview-table th{text-align:left;color:#555;font-weight:600;padding:6px 8px;border-bottom:1px solid #1e1e1e;font-size:11px;text-transform:uppercase}
    .overview-table td{padding:6px 8px;color:#ccc;border-bottom:1px solid #111;vertical-align:top}
    .overview-table tr:hover td{background:#141414}
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
    .view-toggle{display:flex;gap:4px;margin-bottom:12px}
    .view-btn{flex:1;padding:5px 8px;background:#1a1a1a;border:1px solid #333;color:#666;border-radius:4px;font-size:12px;cursor:pointer;text-align:center}
    .view-btn.active{background:#1e2a3a;border-color:#4a9eff;color:#4a9eff}
    .folder-item{padding:5px 8px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:6px;user-select:none}
    .folder-item:hover{background:#1a1a1a}
    .folder-chevron{font-size:10px;color:#555;width:10px;text-align:center;transition:transform .15s}
    .folder-chevron.open{transform:rotate(90deg)}
    .folder-name{font-size:12px;color:#888}
    .folder-count{font-size:10px;color:#444;margin-left:auto}
    .folder-children{padding-left:14px;border-left:1px solid #1e1e1e;margin-left:9px}
    .tab-btn{padding:5px 14px;background:#1a1a1a;border:1px solid #333;color:#666;border-radius:4px;font-size:12px;cursor:pointer}
    .tab-btn.active{background:#1e2a3a;border-color:#4a9eff;color:#4a9eff}
    .trace-card{background:#111;border:1px solid #1e1e1e;border-radius:6px;margin-bottom:12px;overflow:hidden}
    .trace-card.error{border-color:#3a1a1a}
    .trace-header{padding:8px 12px;background:#161616;display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
    .trace-header:hover{background:#1a1a1a}
    .trace-file{color:#4a9eff;font-size:12px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .trace-meta{font-size:11px;color:#555;white-space:nowrap}
    .trace-ok{color:#6bcb77;font-size:11px}
    .trace-err{color:#ff6b6b;font-size:11px}
    .trace-body{display:none;padding:12px}
    .trace-body.open{display:block}
    .trace-section{margin-bottom:10px}
    .trace-section-label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
    .trace-content{background:#0d0d0d;border:1px solid #1a1a1a;border-radius:4px;padding:10px;color:#ccc;font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-word;max-height:300px;overflow-y:auto}
    .trace-content.response{color:#a8d8a8}
  </style>
</head>
<body>
  <header>
    <h1>braito</h1>
    <span class="subtitle">AI Notes</span>
    <div style="margin-left:auto;display:flex;gap:8px">
      <button class="tab-btn active" id="tabNotes" onclick="setTab('notes')">Notas</button>
      <button class="tab-btn" id="tabTrace" onclick="setTab('trace')">LLM Trace</button>
    </div>
  </header>
  <div id="pageNotes" class="container">
    <div class="sidebar">
      <input class="search" id="search" placeholder="Search files..." />
      <button class="overview-btn" onclick="loadOverview()">📋 Repository Overview</button>
      <div class="view-toggle">
        <div class="view-btn active" id="btnDomain" onclick="setView('domain')">Domain</div>
        <div class="view-btn" id="btnFolder" onclick="setView('folder')">Folders</div>
      </div>
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
  <div id="pageTrace" style="display:none;height:calc(100vh - 53px);display:none;flex-direction:column">
    <div style="padding:12px 24px;border-bottom:1px solid #222;display:flex;align-items:center;gap:12px">
      <span style="font-size:13px;color:#666">Interações em tempo real com o LLM. Rode <code style="background:#1a1a1a;padding:2px 6px;border-radius:3px">generate</code> em outro terminal para ver.</span>
      <button onclick="clearTrace()" style="margin-left:auto;padding:4px 12px;background:#1a1a1a;border:1px solid #333;color:#888;border-radius:4px;font-size:12px;cursor:pointer">Limpar</button>
    </div>
    <div id="traceList" style="flex:1;overflow-y:auto;padding:16px 24px;font-family:monospace;font-size:12px"></div>
  </div>
  <script>
    let index = null
    let selected = null
    let viewMode = 'domain'
    const openFolders = new Set()

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

    function setView(mode) {
      viewMode = mode
      document.getElementById('btnDomain').classList.toggle('active', mode === 'domain')
      document.getElementById('btnFolder').classList.toggle('active', mode === 'folder')
      renderList()
    }

    function filteredEntries() {
      const q = document.getElementById('search').value.toLowerCase()
      const minScore = parseFloat(document.getElementById('scoreFilter').value)
      return (index.entries || [])
        .filter(e => e.criticalityScore >= minScore)
        .filter(e => !q || e.relativePath.toLowerCase().includes(q))
    }

    function renderList() {
      if (viewMode === 'folder') { renderFolderTree(); return }

      const entries = filteredEntries()
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
            <div onclick="loadNote('\${e.relativePath}')" style="cursor:pointer;border-radius:5px" class="\${selected === e.relativePath ? 'active' : ''}">
              <div class="file-item" style="pointer-events:none">
                <span class="file-name" title="\${e.relativePath}">\${e.relativePath.split('/').pop()}</span>
                \${e.stale ? '<span class="stale-badge">⚠</span>' : ''}
                <span class="score \${scoreClass(e.criticalityScore)}">\${e.criticalityScore.toFixed(2)}</span>
              </div>
              \${e.summary ? \`<div class="file-summary">\${e.summary}</div>\` : ''}
            </div>
          \`).join('')}
        </div>
      \`).join('')
    }

    function buildTree(entries) {
      const root = { children: {}, files: [] }
      for (const e of entries) {
        const parts = e.relativePath.split('/')
        let node = root
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i]
          if (!node.children[part]) node.children[part] = { children: {}, files: [], path: parts.slice(0, i + 1).join('/') }
          node = node.children[part]
        }
        node.files.push(e)
      }
      return root
    }

    function renderFolderNode(node, depth) {
      const folders = Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b))
      const files = node.files.sort((a, b) => b.criticalityScore - a.criticalityScore)

      let html = ''
      for (const [name, child] of folders) {
        const isOpen = openFolders.has(child.path)
        const fileCount = countFiles(child)
        html += \`
          <div class="folder-item" onclick="toggleFolder('\${child.path}')">
            <span class="folder-chevron \${isOpen ? 'open' : ''}">▶</span>
            <span style="font-size:13px">📁</span>
            <span class="folder-name">\${name}</span>
            <span class="folder-count">\${fileCount}</span>
          </div>
          \${isOpen ? \`<div class="folder-children">\${renderFolderNode(child, depth + 1)}</div>\` : ''}
        \`
      }
      for (const e of files) {
        html += \`
          <div onclick="loadNote('\${e.relativePath}')" style="cursor:pointer;border-radius:5px" class="\${selected === e.relativePath ? 'active' : ''}">
            <div class="file-item" style="pointer-events:none">
              <span class="file-name" title="\${e.relativePath}">\${e.relativePath.split('/').pop()}</span>
              \${e.stale ? '<span class="stale-badge">⚠</span>' : ''}
              <span class="score \${scoreClass(e.criticalityScore)}">\${e.criticalityScore.toFixed(2)}</span>
            </div>
            \${e.summary ? \`<div class="file-summary">\${e.summary}</div>\` : ''}
          </div>
        \`
      }
      return html
    }

    function countFiles(node) {
      let n = node.files.length
      for (const child of Object.values(node.children)) n += countFiles(child)
      return n
    }

    function renderFolderTree() {
      const entries = filteredEntries()
      const list = document.getElementById('fileList')
      if (!entries.length) { list.innerHTML = '<div style="color:#444;font-size:13px;padding:8px">No files match</div>'; return }
      const tree = buildTree(entries)
      list.innerHTML = renderFolderNode(tree, 0)
    }

    function toggleFolder(folderPath) {
      if (openFolders.has(folderPath)) openFolders.delete(folderPath)
      else openFolders.add(folderPath)
      renderFolderTree()
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
      const obs = field.observed.map(o => \`<div class="item">\${escapeHtml(o)}</div>\`).join('')
      const inf = field.inferred.length ? field.inferred.map(i => \`<div class="inferred">↳ \${i}</div>\`).join('') : ''
      return \`<div class="section"><h3>\${title}</h3>\${obs}\${inf}</div>\`
    }

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    }

    function renderDetail(note, relPath) {
      const date = new Date(note.generatedAt).toISOString().slice(0,10)
      document.getElementById('detail').innerHTML = \`
        <h2>\${relPath}</h2>
        <div class="meta">Score: \${note.criticalityScore.toFixed(2)} · Model: \${note.model} · \${date}</div>
        \${note.summary ? \`<div class="detail-summary">\${escapeHtml(note.summary)}</div>\` : ''}
        \${renderField('Purpose', note.purpose)}
        \${renderField('Invariants', note.invariants)}
        \${renderField('Important Decisions', note.importantDecisions)}
        \${renderField('Known Pitfalls', note.knownPitfalls)}
        \${renderField('Sensitive Dependencies', note.sensitiveDependencies)}
        \${renderField('Impact Validation', note.impactValidation)}
      \`
    }

    async function loadOverview() {
      selected = null
      const res = await fetch('/api/overview')
      if (!res.ok) {
        document.getElementById('detail').innerHTML = '<div class="empty-state"><p>Overview not found. Run <code>generate</code> first.</p></div>'
        return
      }
      const ov = await res.json()
      renderOverview(ov)
    }

    function renderOverview(ov) {
      const date = new Date(ov.generatedAt).toISOString().slice(0, 10)
      const domains = (ov.domains || []).map(d => \`
        <tr>
          <td>\${d.name}</td>
          <td>\${d.fileCount}</td>
          <td><span class="score \${scoreClass(d.avgScore)}">\${d.avgScore.toFixed(2)}</span></td>
        </tr>
      \`).join('')

      const criticalRows = (ov.criticalFiles || []).map(f => \`
        <tr onclick="loadNote('\${f.relativePath}')" style="cursor:pointer">
          <td><span class="score \${scoreClass(f.criticalityScore)}">\${f.criticalityScore.toFixed(2)}</span></td>
          <td>\${f.relativePath.split('/').pop()}</td>
          <td style="color:#555;font-size:11px">\${escapeHtml(f.summary).slice(0, 60)}\${f.summary.length > 60 ? '…' : ''}</td>
        </tr>
      \`).join('')

      const entryRows = (ov.entryPoints || []).map(f => \`
        <tr onclick="loadNote('\${f.relativePath}')" style="cursor:pointer">
          <td>\${f.dependentCount}</td>
          <td>\${f.relativePath.split('/').pop()}</td>
          <td style="color:#555;font-size:11px">\${escapeHtml(f.summary).slice(0, 60)}\${f.summary.length > 60 ? '…' : ''}</td>
        </tr>
      \`).join('')

      document.getElementById('detail').innerHTML = \`
        <h2>Repository Overview</h2>
        <div class="meta">Generated: \${date} · Model: \${ov.model}</div>
        <div class="overview-description">\${escapeHtml(ov.description)}</div>

        <div class="stat-grid">
          <div class="stat-card"><div class="stat-value">\${ov.stats.totalFiles}</div><div class="stat-label">Files</div></div>
          <div class="stat-card"><div class="stat-value">\${ov.stats.synthesizedFiles}</div><div class="stat-label">LLM-synthesized</div></div>
          <div class="stat-card"><div class="stat-value">\${ov.stats.avgCriticalityScore.toFixed(2)}</div><div class="stat-label">Avg criticality</div></div>
          <div class="stat-card"><div class="stat-value">\${ov.stats.cycleCount}</div><div class="stat-label">Import cycles</div></div>
        </div>

        \${domains ? \`
        <div class="section"><h3>Domains</h3>
        <table class="overview-table">
          <thead><tr><th>Domain</th><th>Files</th><th>Avg Score</th></tr></thead>
          <tbody>\${domains}</tbody>
        </table></div>\` : ''}

        \${criticalRows ? \`
        <div class="section"><h3>Most Critical Files</h3>
        <table class="overview-table">
          <thead><tr><th>Score</th><th>File</th><th>Summary</th></tr></thead>
          <tbody>\${criticalRows}</tbody>
        </table></div>\` : ''}

        \${entryRows ? \`
        <div class="section"><h3>Entry Points</h3>
        <table class="overview-table">
          <thead><tr><th>Dependents</th><th>File</th><th>Summary</th></tr></thead>
          <tbody>\${entryRows}</tbody>
        </table></div>\` : ''}
      \`
    }

    document.getElementById('search').addEventListener('input', renderList)
    document.getElementById('scoreFilter').addEventListener('change', renderList)
    loadIndex()

    // --- LLM Trace ---
    let traceEvents = []
    let traceEs = null

    function setTab(tab) {
      const isTrace = tab === 'trace'
      document.getElementById('pageNotes').style.display = isTrace ? 'none' : 'grid'
      document.getElementById('pageTrace').style.display = isTrace ? 'flex' : 'none'
      document.getElementById('tabNotes').classList.toggle('active', !isTrace)
      document.getElementById('tabTrace').classList.toggle('active', isTrace)
      if (isTrace && !traceEs) startTraceStream()
    }

    function startTraceStream() {
      traceEs = new EventSource('/api/llm-events')
      traceEs.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data)
          traceEvents.unshift(ev)
          renderTrace()
        } catch {}
      }
    }

    function clearTrace() {
      traceEvents = []
      renderTrace()
    }

    function renderTrace() {
      const list = document.getElementById('traceList')
      if (!traceEvents.length) {
        list.innerHTML = '<div style="color:#444;padding:40px;text-align:center">Nenhuma interação ainda. Rode <code>bun src/cli/index.ts generate --root ./ --force</code></div>'
        return
      }
      list.innerHTML = traceEvents.map((ev, i) => {
        const file = ev.file ? ev.file.split('/').slice(-2).join('/') : '—'
        const ms = ev.durationMs ? \`\${(ev.durationMs/1000).toFixed(1)}s\` : ''
        const ts = new Date(ev.ts).toLocaleTimeString('pt-BR')
        return \`
          <div class="trace-card \${ev.ok ? '' : 'error'}">
            <div class="trace-header" onclick="toggleTrace(\${i})">
              <span class="trace-file" title="\${ev.file}">\${file}</span>
              <span class="trace-meta">\${ev.model} · \${ms} · \${ts}</span>
              <span class="\${ev.ok ? 'trace-ok' : 'trace-err'}">\${ev.ok ? '✓' : '✗'}</span>
            </div>
            <div class="trace-body" id="trace-body-\${i}">
              \${ev.error ? \`<div style="color:#ff6b6b;padding:0 0 8px">\${escapeHtml(ev.error)}</div>\` : ''}
              <div class="trace-section">
                <div class="trace-section-label">Prompt enviado</div>
                <div class="trace-content">\${escapeHtml(ev.prompt)}</div>
              </div>
              \${ev.response ? \`
              <div class="trace-section">
                <div class="trace-section-label">Resposta do modelo</div>
                <div class="trace-content response">\${escapeHtml(ev.response)}</div>
              </div>\` : ''}
            </div>
          </div>
        \`
      }).join('')
    }

    function toggleTrace(i) {
      const body = document.getElementById('trace-body-' + i)
      body.classList.toggle('open')
    }
  </script>
</body>
</html>`
}
