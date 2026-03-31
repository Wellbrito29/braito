import * as vscode from 'vscode'
import { NoteReader } from './noteReader'

export class BraitoDecorationProvider implements vscode.FileDecorationProvider {
  constructor(private reader: NoteReader) {}

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | null {
    const note = this.reader.getNote(uri.fsPath)
    if (!note) return null

    if (this.reader.isStale(note)) {
      return {
        badge: '⚠',
        tooltip: `braito: stale note (score: ${note.criticalityScore.toFixed(2)})`,
        color: new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'),
      }
    }
    if (note.criticalityScore >= 0.7) {
      return {
        badge: '⚡',
        tooltip: `braito: high criticality (${note.criticalityScore.toFixed(2)})`,
        color: new vscode.ThemeColor('gitDecoration.addedResourceForeground'),
      }
    }
    return null
  }
}
