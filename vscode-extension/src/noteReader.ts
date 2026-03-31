import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

export type AiFileNote = {
  filePath: string
  schemaVersion?: string
  criticalityScore: number
  generatedAt: string
  model: string
  purpose: { observed: string[]; inferred: string[]; confidence: number }
  invariants?: { observed: string[]; inferred: string[]; confidence: number }
  sensitiveDependencies?: { observed: string[]; inferred: string[]; confidence: number }
  importantDecisions?: { observed: string[]; inferred: string[]; confidence: number }
  knownPitfalls?: { observed: string[]; inferred: string[]; confidence: number }
  impactValidation?: { observed: string[]; inferred: string[]; confidence: number }
}

export class NoteReader {
  private cache = new Map<string, AiFileNote | null>()

  getNote(filePath: string): AiFileNote | null {
    if (this.cache.has(filePath)) return this.cache.get(filePath)!

    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (!ws) return null

    const relative = path.relative(ws, filePath)
    const notePath = path.join(ws, '.ai-notes', relative + '.json')

    try {
      const raw = fs.readFileSync(notePath, 'utf-8')
      const note = JSON.parse(raw) as AiFileNote
      this.cache.set(filePath, note)
      return note
    } catch {
      this.cache.set(filePath, null)
      return null
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  isStale(note: AiFileNote, thresholdDays = 30): boolean {
    const age = Date.now() - new Date(note.generatedAt).getTime()
    return age > thresholdDays * 24 * 60 * 60 * 1000
  }
}
