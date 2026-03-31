import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { NoteReader } from './noteReader'

export class NotePanel {
  static show(extensionUri: vscode.Uri, fileUri: vscode.Uri, reader: NoteReader): void {
    const note = reader.getNote(fileUri.fsPath)

    const panel = vscode.window.createWebviewPanel(
      'braitoNote',
      `braito: ${path.basename(fileUri.fsPath)}`,
      vscode.ViewColumn.Beside,
      {},
    )

    if (!note) {
      panel.webview.html = `<html><body><p>No note found. Run <code>braito generate</code> first.</p></body></html>`
      return
    }

    // Try to load the .md sidecar for rich rendering
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? ''
    const relative = path.relative(ws, fileUri.fsPath)
    const mdPath = path.join(ws, '.ai-notes', relative + '.md')

    let content = `<p>Score: ${note.criticalityScore.toFixed(2)} | Model: ${note.model}</p>`
    try {
      const md = fs.readFileSync(mdPath, 'utf-8')
      content = `<pre style="white-space:pre-wrap;font-family:monospace">${md.replace(/</g, '&lt;')}</pre>`
    } catch {
      /* fall back to JSON summary */
    }

    panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${content}</body></html>`

    // Suppress unused parameter warning — extensionUri reserved for future asset loading
    void extensionUri
  }
}
