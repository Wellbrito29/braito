import path from 'node:path'
import fs from 'node:fs'
import { loadConfig } from '../../core/config/loadConfig.ts'
import { logger } from '../../core/utils/logger.ts'

const DEFAULT_PORT = 7842

// ---------------------------------------------------------------------------
// Run state — tracks the last/active generate execution
// ---------------------------------------------------------------------------

type RunStatus = 'idle' | 'running' | 'done' | 'error'

const runState = {
  status: 'idle' as RunStatus,
  startedAt: null as string | null,
  finishedAt: null as string | null,
  logs: [] as Array<{ ts: string; level: string; text: string }>,
}

function pushLog(level: string, text: string) {
  runState.logs.push({ ts: new Date().toISOString(), level, text })
}

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
    async fetch(req) {
      const url = new URL(req.url)

      // API: GET /api/index
      if (url.pathname === '/api/index') {
        return serveJson(path.join(notesDir, 'index.json'))
      }

      // API: GET /api/stats
      if (url.pathname === '/api/stats') {
        return computeStats(notesDir)
      }

      // API: POST /api/run  — start a generate run
      if (url.pathname === '/api/run' && req.method === 'POST') {
        if (runState.status === 'running') {
          return new Response(JSON.stringify({ error: 'Already running' }), {
            status: 409, headers: { 'Content-Type': 'application/json' },
          })
        }
        const body = await req.json().catch(() => ({})) as Record<string, unknown>
        const force = body.force === true
        const verbose = body.verbose === true

        // Fire-and-forget; logs captured via intercepted console
        runState.status = 'running'
        runState.startedAt = new Date().toISOString()
        runState.finishedAt = null
        runState.logs = []

        const origLog = console.log
        const origError = console.error
        const origWarn = console.warn

        const capture = (level: string) => (...args: unknown[]) => {
          const text = args.join(' ').replace(/\x1b\[[0-9;]*m/g, '')
          pushLog(level, text)
        }
        console.log = capture('info')
        console.error = capture('error')
        console.warn = capture('warn')

        ;(async () => {
          try {
            const { runGenerate } = await import('./generate.ts')
            await runGenerate({ root, force, verbose })
            runState.status = 'done'
          } catch (err: unknown) {
            pushLog('error', String(err instanceof Error ? err.message : err))
            runState.status = 'error'
          } finally {
            console.log = origLog
            console.error = origError
            console.warn = origWarn
            runState.finishedAt = new Date().toISOString()
          }
        })()

        return new Response(JSON.stringify({ started: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // API: GET /api/run/status  — poll for log lines and status
      if (url.pathname === '/api/run/status') {
        const since = parseInt(url.searchParams.get('since') ?? '0', 10)
        return new Response(
          JSON.stringify({
            status: runState.status,
            startedAt: runState.startedAt,
            finishedAt: runState.finishedAt,
            logs: runState.logs.slice(since),
            total: runState.logs.length,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        )
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

      // API: GET /api/graph — serve graph.json or build from index
      if (url.pathname === '/api/graph') {
        const graphPath = path.join(notesDir, 'graph.json')
        if (fs.existsSync(graphPath)) {
          try {
            const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'))
            const nodes = (graph.nodes || []).map((n: { path: string; domain: string; criticalityScore: number }) => ({
              id: n.path, domain: n.domain, score: n.criticalityScore,
            }))
            const links = (graph.edges || []).map((e: { from: string; to: string }) => ({
              source: e.from, target: e.to,
            }))
            return new Response(JSON.stringify({ nodes, links }), {
              headers: { 'Content-Type': 'application/json' },
            })
          } catch {
            return new Response(JSON.stringify({ error: 'Failed to parse graph.json' }), {
              status: 500, headers: { 'Content-Type': 'application/json' },
            })
          }
        }
        const indexPath = path.join(notesDir, 'index.json')
        if (fs.existsSync(indexPath)) {
          try {
            const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
            const nodes = (index.entries || []).map((e: { relativePath: string; domain: string; criticalityScore: number }) => ({
              id: e.relativePath, domain: e.domain, score: e.criticalityScore,
            }))
            const links: Array<{ source: string; target: string }> = []
            for (const entry of index.entries || []) {
              for (const dep of entry.dependents || []) {
                links.push({ source: entry.relativePath, target: dep })
              }
            }
            return new Response(JSON.stringify({ nodes, links }), {
              headers: { 'Content-Type': 'application/json' },
            })
          } catch {
            return new Response(JSON.stringify({ error: 'Failed to build graph from index' }), {
              status: 500, headers: { 'Content-Type': 'application/json' },
            })
          }
        }
        return new Response(JSON.stringify({ error: 'No graph or index found' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        })
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

function computeStats(notesDir: string): Response {
  const stats = { total: 0, withTests: 0, withoutTests: 0, coverageSum: 0, coverageCount: 0 }
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) { walk(path.join(dir, entry.name)); continue }
      if (!entry.name.endsWith('.json') || entry.name === 'index.json') continue
      try {
        const note = JSON.parse(fs.readFileSync(path.join(dir, entry.name), 'utf-8'))
        const s = note.debugSignals
        if (!s) continue
        stats.total++
        if (s.hasTests) stats.withTests++
        else stats.withoutTests++
        if (s.coveragePct != null) { stats.coverageSum += s.coveragePct; stats.coverageCount++ }
      } catch { /* skip malformed */ }
    }
  }
  walk(notesDir)
  const avgCoverage = stats.coverageCount > 0 ? stats.coverageSum / stats.coverageCount : null
  return new Response(JSON.stringify({ ...stats, avgCoverage }), {
    headers: { 'Content-Type': 'application/json' },
  })
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
  <script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
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
    .tab-bar{display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid #222;padding-bottom:0;align-items:flex-end}
    .tab{padding:6px 14px;font-size:12px;cursor:pointer;color:#666;border-bottom:2px solid transparent;margin-bottom:-1px}
    .tab:hover{color:#ccc}
    .tab.active{color:#4a9eff;border-bottom-color:#4a9eff}
    .tab-action{margin-left:auto;padding:4px 10px;font-size:11px;cursor:pointer;color:#666;background:#1a1a1a;border:1px solid #333;border-radius:4px;white-space:nowrap}
    .tab-action:hover{color:#ccc;border-color:#555}
    .section{margin-bottom:20px}
    .section-title{font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #1e1e1e;display:flex;align-items:center;gap:6px}
    .conf-warn{font-size:10px;padding:1px 5px;border-radius:4px;font-weight:600;text-transform:none;letter-spacing:0}
    .conf-low{background:#2a1a00;color:#f0a500}
    .conf-very-low{background:#2a1a1a;color:#ff6b6b}
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
    .debug-section{margin-bottom:20px}
    .debug-section h4{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #1a1a1a}
    .signal-row{margin-bottom:10px}
    .signal-header{font-size:12px;color:#888;display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px}
    .signal-label{display:flex;align-items:center;gap:6px}
    .signal-detail{font-size:11px;color:#555}
    .signal-contrib{font-size:12px;font-weight:600;font-family:monospace}
    .signal-contrib.pos{color:#6bcb77}
    .signal-contrib.zero{color:#333}
    .signal-bar-track{height:5px;background:#1a1a1a;border-radius:3px;overflow:hidden}
    .signal-bar-fill{height:100%;border-radius:3px;transition:width .3s}
    .signal-fill-pos{background:#4a9eff}
    .signal-fill-high{background:#ff6b6b}
    .score-total{font-size:22px;font-weight:700;margin-bottom:4px}
    .score-total.high{color:#ff6b6b}
    .score-total.mid{color:#ffd93d}
    .score-total.low{color:#6bcb77}
    .co-changed-row{display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #141414;font-size:12px}
    .co-changed-path{color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .co-changed-count{font-size:11px;font-weight:600;padding:1px 7px;border-radius:8px;background:#1e2a1a;color:#6bcb77;white-space:nowrap;margin-left:8px}
    .json-pre{background:#111;border:1px solid #1e1e1e;border-radius:6px;padding:16px;font-family:monospace;font-size:11px;color:#aaa;overflow:auto;max-height:500px;margin-top:8px;white-space:pre;display:none}
    .json-pre.visible{display:block}
    .empty-state{text-align:center;padding:80px 24px;color:#444}
    .empty-state p{font-size:14px}
    .filter-bar{display:flex;gap:8px;margin-bottom:12px;align-items:center}
    .filter-label{font-size:12px;color:#666;white-space:nowrap}
    select{background:#1a1a1a;border:1px solid #333;color:#ccc;padding:4px 8px;border-radius:4px;font-size:12px}
    .stats-strip{display:flex;gap:0;margin-bottom:12px;border:1px solid #1e1e1e;border-radius:6px;overflow:hidden}
    .stat-cell{flex:1;padding:7px 6px;text-align:center;border-right:1px solid #1e1e1e;background:#111}
    .stat-cell:last-child{border-right:none}
    .stat-val{font-size:14px;font-weight:700}
    .stat-val.green{color:#6bcb77}
    .stat-val.red{color:#ff6b6b}
    .stat-val.blue{color:#4a9eff}
    .stat-lbl{font-size:10px;color:#555;margin-top:1px}
    .cov-bar-track{height:8px;background:#1a1a1a;border-radius:4px;overflow:hidden;margin:6px 0}
    .cov-bar-fill{height:100%;border-radius:4px;transition:width .4s}
    .cov-high{background:#6bcb77}
    .cov-mid{background:#ffd93d}
    .cov-low{background:#ff6b6b}
    .test-status{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:6px;font-size:13px;font-weight:600;margin-bottom:12px}
    .test-status.covered{background:#1a2a1a;color:#6bcb77}
    .test-status.uncovered{background:#2a1a1a;color:#ff6b6b}
    .related-test{padding:5px 0;border-bottom:1px solid #141414;font-size:12px;color:#c77bff;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .test-tip{margin-top:12px;padding:10px 12px;background:#111;border:1px solid #1e1e1e;border-radius:6px;font-size:12px;color:#555;border-left:3px solid #333}
    .run-btn{padding:5px 14px;background:#1a2a1a;border:1px solid #2a4a2a;border-radius:5px;color:#6bcb77;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}
    .run-btn:hover{background:#1e3a1e;border-color:#3a6a3a}
    .run-btn:disabled{opacity:.4;cursor:not-allowed}
    .run-panel{position:fixed;bottom:0;left:0;right:0;background:#0a0a0a;border-top:1px solid #222;z-index:100;display:none;flex-direction:column;max-height:40vh}
    .run-panel.open{display:flex}
    .run-header{display:flex;align-items:center;gap:10px;padding:8px 16px;border-bottom:1px solid #1a1a1a;background:#0f0f0f}
    .run-title{font-size:12px;font-weight:600;color:#888}
    .run-status{font-size:11px;padding:2px 8px;border-radius:8px;font-weight:600}
    .run-status.running{background:#1a2a1a;color:#6bcb77;animation:pulse 1s infinite}
    .run-status.done{background:#1a2a1a;color:#6bcb77}
    .run-status.error{background:#2a1a1a;color:#ff6b6b}
    .run-status.idle{background:#1a1a1a;color:#555}
    .run-close{margin-left:auto;font-size:16px;cursor:pointer;color:#444;padding:0 4px}
    .run-close:hover{color:#888}
    .run-log{flex:1;overflow-y:auto;padding:10px 16px;font-family:monospace;font-size:11px;line-height:1.6}
    .log-line{display:flex;gap:10px;padding:1px 0}
    .log-ts{color:#333;white-space:nowrap;flex-shrink:0}
    .log-text.info{color:#999}
    .log-text.warn{color:#f0a500}
    .log-text.error{color:#ff6b6b}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  </style>
</head>
<body>
  <header>
    <h1>braito</h1>
    <span class="subtitle">AI Notes</span>
    <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
      <label style="font-size:11px;color:#555;display:flex;align-items:center;gap:4px;cursor:pointer">
        <input type="checkbox" id="forceCheck" style="cursor:pointer"> --force
      </label>
      <label style="font-size:11px;color:#555;display:flex;align-items:center;gap:4px;cursor:pointer">
        <input type="checkbox" id="verboseCheck" style="cursor:pointer"> --verbose
      </label>
      <button class="run-btn" id="runBtn" onclick="startRun()">▶ Run generate</button>
    </div>
  </header>
  <div class="run-panel" id="runPanel">
    <div class="run-header">
      <span class="run-title">Pipeline execution</span>
      <span class="run-status idle" id="runStatus">idle</span>
      <span style="font-size:11px;color:#444" id="runTimer"></span>
      <span class="run-close" onclick="document.getElementById('runPanel').classList.remove('open')">✕</span>
    </div>
    <div class="run-log" id="runLog"></div>
  </div>
  <div class="container">
    <div class="sidebar">
      <input class="search" id="search" placeholder="Search files..." />
      <div class="stats-strip" id="stats-strip" style="display:none">
        <div class="stat-cell"><div class="stat-val blue" id="stat-total">—</div><div class="stat-lbl">files</div></div>
        <div class="stat-cell"><div class="stat-val green" id="stat-covered">—</div><div class="stat-lbl">covered</div></div>
        <div class="stat-cell"><div class="stat-val red" id="stat-uncovered">—</div><div class="stat-lbl">uncovered</div></div>
        <div class="stat-cell"><div class="stat-val" id="stat-avg" style="color:#ffd93d">—</div><div class="stat-lbl">avg cov</div></div>
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
  <script>
    let index = null
    let selected = null
    let activeTab = 'note'
    let jsonVisible = false

    async function loadIndex() {
      const res = await fetch('/api/index')
      index = await res.json()
      renderList()
    }

    async function loadStats() {
      try {
        const res = await fetch('/api/stats')
        const s = await res.json()
        if (!s || s.total === 0) return
        document.getElementById('stat-total').textContent = s.total
        document.getElementById('stat-covered').textContent = s.withTests
        document.getElementById('stat-uncovered').textContent = s.withoutTests
        document.getElementById('stat-avg').textContent =
          s.avgCoverage != null ? (s.avgCoverage * 100).toFixed(0) + '%' : 'n/a'
        document.getElementById('stats-strip').style.display = 'flex'
      } catch {}
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
      jsonVisible = false
      renderDetail(note, relPath)
    }

    // ── Note tab ────────────────────────────────────────────────────────────

    function confBadge(field) {
      if (!field) return ''
      const c = field.confidence
      if (c < 0.3) return '<span class="conf-warn conf-very-low">⚠ very low confidence</span>'
      if (c < 0.5) return '<span class="conf-warn conf-low">⚠ low confidence</span>'
      return ''
    }

    function renderField(title, field) {
      if (!field || (!field.observed.length && !field.inferred.length)) return ''
      const obs = field.observed.map(o => \`<div class="item">\${escHtml(o)}</div>\`).join('')
      const inf = field.inferred.length ? field.inferred.map(i => \`<div class="inferred">↳ \${escHtml(i)}</div>\`).join('') : ''
      return \`<div class="section">
        <div class="section-title">\${title} \${confBadge(field)}</div>
        \${obs}\${inf}
      </div>\`
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

    // ── Debug tab ───────────────────────────────────────────────────────────

    function escHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    }

    function badgeClass(type) {
      return 'badge badge-' + (type || 'code')
    }

    function signalContributions(s) {
      if (!s) return []
      return [
        {
          label: 'Reverse dependencies',
          detail: s.reverseDepCount + ' consumers',
          contrib: Math.min(s.reverseDepCount * 0.1, 0.4),
          max: 0.4,
        },
        {
          label: 'Exports hooks',
          detail: s.hasHooks ? 'yes' : 'no',
          contrib: s.hasHooks ? 0.2 : 0,
          max: 0.2,
        },
        {
          label: 'External imports',
          detail: s.hasExternalImports ? 'yes' : 'no',
          contrib: s.hasExternalImports ? 0.1 : 0,
          max: 0.1,
        },
        {
          label: 'Env var usage',
          detail: s.hasEnvVars ? 'yes' : 'no',
          contrib: s.hasEnvVars ? 0.1 : 0,
          max: 0.1,
        },
        {
          label: 'Outbound API calls',
          detail: s.hasApiCalls ? 'yes' : 'no',
          contrib: s.hasApiCalls ? 0.1 : 0,
          max: 0.1,
        },
        {
          label: 'No test coverage',
          detail: s.hasTests
            ? (s.coveragePct != null ? (s.coveragePct * 100).toFixed(0) + '% covered' : 'has tests')
            : (s.reverseDepCount > 0 ? 'uncovered + has consumers' : 'uncovered'),
          contrib: s.hasTests ? 0 : (s.reverseDepCount > 0 ? 0.15 : 0.05),
          max: 0.15,
        },
        {
          label: 'Churn',
          detail: s.churnScore + ' commits',
          contrib: Math.min(s.churnScore * 0.01, 0.15),
          max: 0.15,
        },
        {
          label: 'TODO / FIXME / HACK',
          detail: s.hasTodoComments ? 'yes' : 'no',
          contrib: s.hasTodoComments ? 0.05 : 0,
          max: 0.05,
        },
        {
          label: 'Multiple authors',
          detail: s.authorCount + ' authors',
          contrib: s.authorCount > 3 ? 0.05 : 0,
          max: 0.05,
        },
      ]
    }

    function renderScoreBreakdown(note) {
      const score = note.criticalityScore
      const totalClass = score >= 0.7 ? 'high' : score >= 0.4 ? 'mid' : 'low'
      const signals = signalContributions(note.debugSignals)

      const rows = signals.map(sig => {
        const pct = sig.max > 0 ? Math.min(sig.contrib / sig.max * 100, 100).toFixed(0) : 0
        const contribStr = sig.contrib > 0 ? '+' + sig.contrib.toFixed(2) : '—'
        const fillClass = sig.contrib > 0.3 ? 'signal-fill-high' : 'signal-fill-pos'
        return \`<div class="signal-row">
          <div class="signal-header">
            <span class="signal-label">
              \${escHtml(sig.label)}
              <span class="signal-detail">\${escHtml(sig.detail)}</span>
            </span>
            <span class="signal-contrib \${sig.contrib > 0 ? 'pos' : 'zero'}">\${contribStr}</span>
          </div>
          <div class="signal-bar-track">
            <div class="signal-bar-fill \${sig.contrib > 0 ? fillClass : ''}" style="width:\${pct}%"></div>
          </div>
        </div>\`
      }).join('')

      return \`<div class="debug-section">
        <h4>Score breakdown</h4>
        <div class="score-total \${totalClass}">\${score.toFixed(2)}</div>
        \${rows}
      </div>\`
    }

    function renderEvidenceSection(note) {
      const fields = ['purpose','invariants','sensitiveDependencies','importantDecisions','knownPitfalls','impactValidation']
      const fieldLabels = {purpose:'Purpose',invariants:'Invariants',sensitiveDependencies:'Sensitive Deps',importantDecisions:'Decisions',knownPitfalls:'Pitfalls',impactValidation:'Impact'}
      let html = ''
      for (const f of fields) {
        const field = note[f]
        if (!field || !field.evidence || field.evidence.length === 0) continue
        html += \`<div class="debug-section"><h4>\${fieldLabels[f]} — \${field.evidence.length} item(s), confidence \${field.confidence.toFixed(2)}</h4>
          <table class="evidence-table"><thead><tr><th>Type</th><th>Detail</th></tr></thead><tbody>
          \${field.evidence.map(e => \`<tr><td><span class="\${badgeClass(e.type)}">\${e.type}</span></td><td>\${escHtml(e.detail)}</td></tr>\`).join('')}
          </tbody></table></div>\`
      }
      return html || '<div style="color:#444;font-size:13px">No evidence items recorded.</div>'
    }

    function renderCoChanged(note) {
      const files = note.debugSignals?.coChangedFiles
      if (!files || files.length === 0) return '<div style="color:#444;font-size:13px">No co-change data available.</div>'
      return files
        .sort((a, b) => b.count - a.count)
        .map(f => \`<div class="co-changed-row">
          <span class="co-changed-path" title="\${escHtml(f.path)}">\${escHtml(f.path)}</span>
          <span class="co-changed-count">\${f.count}x</span>
        </div>\`)
        .join('')
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

    function renderDebugTab(note) {
      return \`
        \${renderScoreBreakdown(note)}
        <div class="debug-section">
          <h4>Evidence trail</h4>
          \${renderEvidenceSection(note)}
        </div>
        <div class="debug-section">
          <h4>Co-changed files</h4>
          \${renderCoChanged(note)}
        </div>
        <div class="debug-section">
          <h4>Changelog (\${(note.recentChanges||[]).length} commits)</h4>
          \${renderChangelog(note.recentChanges)}
        </div>
      \`
    }

    // ── Tests tab ────────────────────────────────────────────────────────────

    function renderTestsTab(note) {
      const s = note.debugSignals || {}
      const hasTests = !!s.hasTests
      const covPct = s.coveragePct != null ? s.coveragePct : null

      // Extract related test files from impactValidation.observed
      const related = (note.impactValidation?.observed || [])
        .filter(l => /related test|\.test\.|\.spec\.|__tests__/i.test(l))
        .map(l => l.replace(/^Related test:\s*/i, ''))

      const statusHtml = \`<div class="test-status \${hasTests ? 'covered' : 'uncovered'}">
        \${hasTests ? '✓ Covered' : '✗ No tests found'}
      </div>\`

      let covHtml = ''
      if (covPct != null) {
        const pct = (covPct * 100).toFixed(1)
        const fillClass = covPct >= 0.7 ? 'cov-high' : covPct >= 0.4 ? 'cov-mid' : 'cov-low'
        covHtml = \`<div class="debug-section">
          <h4>Line coverage</h4>
          <div style="font-size:22px;font-weight:700;color:\${covPct>=0.7?'#6bcb77':covPct>=0.4?'#ffd93d':'#ff6b6b'}">\${pct}%</div>
          <div class="cov-bar-track"><div class="cov-bar-fill \${fillClass}" style="width:\${Math.min(covPct*100,100)}%"></div></div>
        </div>\`
      }

      const relHtml = related.length
        ? \`<div class="debug-section"><h4>\${related.length} related test file\${related.length>1?'s':''}</h4>
            \${related.map(t => \`<div class="related-test" title="\${escHtml(t)}">\${escHtml(t)}</div>\`).join('')}
          </div>\`
        : ''

      const tipHtml = !hasTests
        ? \`<div class="test-tip">
            No test file detected for this file. Adding tests will reduce its criticality penalty (+0.05–0.15).
            Run <code style="color:#ccc">bun test</code> after adding tests, then re-generate notes with
            <code style="color:#ccc">bun src/cli/index.ts generate --root ./ --force</code>.
          </div>\`
        : ''

      const rawHtml = \`<div class="debug-section" style="margin-top:12px">
        <h4>Raw signals</h4>
        <table class="evidence-table"><tbody>
          <tr><td style="color:#888">hasTests</td><td>\${hasTests}</td></tr>
          <tr><td style="color:#888">coveragePct</td><td>\${covPct != null ? (covPct*100).toFixed(1)+'%' : 'n/a'}</td></tr>
          <tr><td style="color:#888">churnScore</td><td>\${s.churnScore ?? '—'}</td></tr>
          <tr><td style="color:#888">authorCount</td><td>\${s.authorCount ?? '—'}</td></tr>
        </tbody></table>
      </div>\`

      return statusHtml + covHtml + relHtml + tipHtml + rawHtml
    }

    // ── Tab switching & detail render ────────────────────────────────────────

    function switchTab(tab, note) {
      activeTab = tab
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab))
      const content = tab === 'debug' ? renderDebugTab(note) : tab === 'tests' ? renderTestsTab(note) : tab === 'graph' ? '' : renderNoteTab(note)
      document.getElementById('tab-content').innerHTML = content
      if (tab === 'graph') renderGraphTab()
    }

    function toggleJson(note) {
      jsonVisible = !jsonVisible
      const pre = document.getElementById('json-pre')
      const btn = document.getElementById('json-btn')
      if (jsonVisible) {
        pre.textContent = JSON.stringify(note, null, 2)
        pre.classList.add('visible')
        btn.textContent = 'Hide JSON'
      } else {
        pre.classList.remove('visible')
        btn.textContent = 'View raw JSON'
      }
    }

    // ── Graph tab ──────────────────────────────────────────────────────────

    let graphData = null
    const domainColors = {}
    const colorScale = ['#4a9eff','#ff6b6b','#51cf66','#ffd43b','#cc5de8','#ff922b','#20c997','#e599f7','#74c0fc','#f06595','#a9e34b','#3bc9db']
    let colorIdx = 0

    function getDomainColor(domain) {
      if (!domainColors[domain]) {
        domainColors[domain] = colorScale[colorIdx % colorScale.length]
        colorIdx++
      }
      return domainColors[domain]
    }

    async function loadGraphData() {
      if (graphData) return graphData
      try {
        const res = await fetch('/api/graph')
        graphData = await res.json()
      } catch {
        graphData = { nodes: [], links: [] }
      }
      return graphData
    }

    async function renderGraphTab() {
      const container = document.getElementById('tab-content')
      if (!container) return
      container.innerHTML = '<div style="color:#444;text-align:center;padding:40px">Loading graph...</div>'

      const data = await loadGraphData()
      if (!data.nodes || data.nodes.length === 0) {
        container.innerHTML = '<div style="color:#666;text-align:center;padding:40px">No graph data available. Run generate first.</div>'
        return
      }

      const filterId = 'graph-filter'
      container.innerHTML = '<div style="padding:8px 0 4px;display:flex;align-items:center;gap:12px">' +
        '<label style="font-size:12px;color:#888">Min score:</label>' +
        '<input type="range" id="' + filterId + '" min="0" max="100" value="0" style="width:120px">' +
        '<span id="graph-filter-val" style="font-size:12px;color:#aaa">0.00</span>' +
        '<span style="font-size:11px;color:#555;margin-left:auto" id="graph-stats"></span>' +
        '</div>' +
        '<div id="graph-svg-wrap" style="width:100%;height:calc(100vh - 220px);background:#111;border:1px solid #1e1e1e;border-radius:6px;overflow:hidden;position:relative"></div>'

      const wrap = document.getElementById('graph-svg-wrap')
      const width = wrap.clientWidth
      const height = wrap.clientHeight

      let minScore = 0
      let nodes = data.nodes.map(n => ({...n}))
      let nodeIds = new Set(nodes.map(n => n.id))
      let links = data.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target)).map(l => ({...l}))

      function buildGraph(threshold) {
        nodes = data.nodes.filter(n => n.score >= threshold).map(n => ({...n}))
        nodeIds = new Set(nodes.map(n => n.id))
        links = data.links.filter(l => nodeIds.has(typeof l.source === 'object' ? l.source.id : l.source) && nodeIds.has(typeof l.target === 'object' ? l.target.id : l.target)).map(l => ({source: typeof l.source === 'object' ? l.source.id : l.source, target: typeof l.target === 'object' ? l.target.id : l.target}))
        document.getElementById('graph-stats').textContent = nodes.length + ' nodes, ' + links.length + ' edges'
      }

      buildGraph(0)

      d3.select('#graph-svg-wrap').selectAll('svg').remove()
      const svg = d3.select('#graph-svg-wrap').append('svg')
        .attr('width', width).attr('height', height)
        .style('background', '#111')

      const g = svg.append('g')

      const zoom = d3.zoom().scaleExtent([0.1, 5]).on('zoom', (e) => g.attr('transform', e.transform))
      svg.call(zoom)

      svg.append('defs').append('marker')
        .attr('id', 'arrow').attr('viewBox', '0 -5 10 10')
        .attr('refX', 20).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#333')

      const rScale = d3.scaleLinear().domain([0, 1]).range([4, 16])

      const linkG = g.append('g')
      const nodeG = g.append('g')

      function render() {
        linkG.selectAll('line').remove()
        const linkEls = linkG.selectAll('line').data(links).join('line')
          .attr('stroke', '#222').attr('stroke-width', 0.5).attr('marker-end', 'url(#arrow)')
          .style('opacity', 0.3)

        nodeG.selectAll('circle').remove()
        nodeG.selectAll('text').remove()
        const nodeEls = nodeG.selectAll('circle').data(nodes, d => d.id).join('circle')
          .attr('r', d => rScale(d.score))
          .attr('fill', d => getDomainColor(d.domain))
          .attr('stroke', '#000').attr('stroke-width', 0.5)
          .style('cursor', 'pointer')
          .style('opacity', 0.85)

        const labelEls = nodeG.selectAll('text').data(nodes.filter(n => n.score >= 0.5), d => d.id).join('text')
          .text(d => d.id.split('/').pop().replace(/\\.\\w+$/, ''))
          .attr('font-size', 9).attr('fill', '#888').attr('dx', d => rScale(d.score) + 3).attr('dy', 3)
          .style('pointer-events', 'none')

        const tooltip = d3.select('#graph-svg-wrap').selectAll('.graph-tip').data([0]).join('div')
          .attr('class', 'graph-tip')
          .style('position', 'absolute').style('background', '#1a1a1a').style('border', '1px solid #333')
          .style('padding', '6px 10px').style('border-radius', '4px').style('font-size', '11px')
          .style('color', '#ccc').style('pointer-events', 'none').style('display', 'none').style('z-index', '10')
          .style('max-width', '300px').style('white-space', 'nowrap').style('overflow', 'hidden').style('text-overflow', 'ellipsis')

        nodeEls.on('mouseover', (e, d) => {
          tooltip.style('display', 'block')
            .html('<strong>' + d.id + '</strong><br>Score: ' + d.score.toFixed(2) + ' | Domain: ' + d.domain)
          const neighbors = new Set()
          links.forEach(l => {
            const sid = typeof l.source === 'object' ? l.source.id : l.source
            const tid = typeof l.target === 'object' ? l.target.id : l.target
            if (sid === d.id) neighbors.add(tid)
            if (tid === d.id) neighbors.add(sid)
          })
          neighbors.add(d.id)
          nodeEls.style('opacity', n => neighbors.has(n.id) ? 1 : 0.15)
          linkEls.style('opacity', l => {
            const sid = typeof l.source === 'object' ? l.source.id : l.source
            const tid = typeof l.target === 'object' ? l.target.id : l.target
            return (sid === d.id || tid === d.id) ? 0.6 : 0.05
          })
        }).on('mousemove', (e) => {
          const rect = wrap.getBoundingClientRect()
          tooltip.style('left', (e.clientX - rect.left + 12) + 'px').style('top', (e.clientY - rect.top - 10) + 'px')
        }).on('mouseout', () => {
          tooltip.style('display', 'none')
          nodeEls.style('opacity', 0.85)
          linkEls.style('opacity', 0.3)
        }).on('click', (e, d) => {
          loadNote(d.id)
          activeTab = 'graph'
        })

        nodeEls.call(d3.drag()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
        )

        const sim = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(60))
          .force('charge', d3.forceManyBody().strength(-150))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(d => rScale(d.score) + 2))
          .on('tick', () => {
            linkEls.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
              .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
            nodeEls.attr('cx', d => d.x).attr('cy', d => d.y)
            labelEls.attr('x', d => d.x).attr('y', d => d.y)
          })

        if (selected) {
          nodeEls.attr('stroke', d => d.id === selected ? '#4a9eff' : '#000')
            .attr('stroke-width', d => d.id === selected ? 2.5 : 0.5)
        }

        return sim
      }

      let currentSim = render()

      document.getElementById(filterId).addEventListener('input', function() {
        const val = this.value / 100
        document.getElementById('graph-filter-val').textContent = val.toFixed(2)
        if (currentSim) currentSim.stop()
        buildGraph(val)
        currentSim = render()
      })
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
          <div class="tab \${activeTab==='tests'?'active':''}" data-tab="tests" onclick="switchTab('tests', currentNote)">Tests</div>
          <div class="tab \${activeTab==='graph'?'active':''}" data-tab="graph" onclick="switchTab('graph', currentNote)">Graph</div>
          <button class="tab-action" id="json-btn" onclick="toggleJson(currentNote)">View raw JSON</button>
        </div>
        <div id="tab-content"></div>
        <pre class="json-pre" id="json-pre"></pre>
      \`
      window.currentNote = note
      if (activeTab === 'graph') {
        document.getElementById('tab-content').innerHTML = ''
        renderGraphTab()
      } else {
        document.getElementById('tab-content').innerHTML = activeTab === 'debug' ? renderDebugTab(note) : activeTab === 'tests' ? renderTestsTab(note) : renderNoteTab(note)
      }
    }

    // ── Run panel ────────────────────────────────────────────────────────────

    let pollTimer = null
    let logOffset = 0
    let runStart = null

    const STEP_ICONS = {
      'Found': '📂',
      'Analyzing': '🔍',
      'Building dependency': '🕸',
      'Writing notes': '✍',
      'Generated': '✅',
      'Skipped': '⏭',
      'Cache': '💾',
      'Filter': '🔎',
      'Dry run': '👁',
      'error': '❌',
      'warn': '⚠',
    }

    function stepIcon(text, level) {
      if (level === 'error') return '❌'
      if (level === 'warn') return '⚠'
      for (const [key, icon] of Object.entries(STEP_ICONS)) {
        if (text.includes(key)) return icon
      }
      return '·'
    }

    function appendLogs(lines) {
      const log = document.getElementById('runLog')
      for (const l of lines) {
        const div = document.createElement('div')
        div.className = 'log-line'
        const time = l.ts.slice(11, 19)
        const icon = stepIcon(l.text, l.level)
        div.innerHTML = \`<span class="log-ts">\${time}</span><span class="log-text \${l.level}">\${icon} \${escHtml(l.text)}</span>\`
        log.appendChild(div)
      }
      log.scrollTop = log.scrollHeight
    }

    async function pollRun() {
      const res = await fetch('/api/run/status?since=' + logOffset).catch(() => null)
      if (!res) return
      const data = await res.json()
      if (data.logs && data.logs.length > 0) {
        appendLogs(data.logs)
        logOffset = data.total
      }
      const statusEl = document.getElementById('runStatus')
      statusEl.textContent = data.status
      statusEl.className = 'run-status ' + data.status
      if (data.startedAt && runStart) {
        const elapsed = ((Date.now() - runStart) / 1000).toFixed(1)
        document.getElementById('runTimer').textContent = elapsed + 's'
      }
      if (data.status === 'done' || data.status === 'error') {
        clearInterval(pollTimer)
        pollTimer = null
        document.getElementById('runBtn').disabled = false
        document.getElementById('runBtn').textContent = '▶ Run generate'
        if (data.status === 'done') {
          // Refresh index after successful run
          const r = await fetch('/api/index')
          index = await r.json()
          renderList()
          await loadStats()
        }
      }
    }

    async function startRun() {
      const force = document.getElementById('forceCheck').checked
      const panel = document.getElementById('runPanel')
      const log = document.getElementById('runLog')
      const btn = document.getElementById('runBtn')

      panel.classList.add('open')
      log.innerHTML = ''
      logOffset = 0
      runStart = Date.now()
      document.getElementById('runTimer').textContent = ''

      const statusEl = document.getElementById('runStatus')
      statusEl.textContent = 'running'
      statusEl.className = 'run-status running'

      btn.disabled = true
      btn.textContent = '⏳ Running...'

      const verbose = document.getElementById('verboseCheck').checked
      await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force, verbose }) })
      pollTimer = setInterval(pollRun, 400)
    }

    document.getElementById('search').addEventListener('input', renderList)
    document.getElementById('scoreFilter').addEventListener('change', renderList)
    loadIndex()
    loadStats()
  </script>
</body>
</html>`
}
