import * as vscode from 'vscode'
import * as path from 'path'
import { NoteReader } from './noteReader'

export class BraitoHoverProvider implements vscode.HoverProvider {
  constructor(private reader: NoteReader) {}

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
    const line = document.lineAt(position).text
    const importMatch = line.match(/from\s+['"]([^'"]+)['"]/)
    if (!importMatch) return null

    const importPath = importMatch[1]
    if (!importPath.startsWith('.')) return null

    const dir = path.dirname(document.uri.fsPath)
    const resolved = path.resolve(dir, importPath)
    const candidates = [resolved, resolved + '.ts', resolved + '.tsx', resolved + '/index.ts']

    for (const candidate of candidates) {
      const note = this.reader.getNote(candidate)
      if (!note) continue

      const score = note.criticalityScore.toFixed(2)
      const purpose = note.purpose.observed[0] ?? note.purpose.inferred[0] ?? 'No description'
      const staleWarning = this.reader.isStale(note)
        ? '\n\n⚠ **Note is stale** — run `braito generate` to refresh'
        : ''

      const md = new vscode.MarkdownString(
        `**braito** — criticality: \`${score}\`\n\n${purpose}${staleWarning}`,
      )
      return new vscode.Hover(md)
    }
    return null
  }
}
