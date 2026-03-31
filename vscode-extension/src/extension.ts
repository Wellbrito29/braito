import * as vscode from 'vscode'
import { NoteReader } from './noteReader'
import { BraitoHoverProvider } from './hoverProvider'
import { BraitoDecorationProvider } from './decorationProvider'
import { NotePanel } from './notePanel'

export function activate(context: vscode.ExtensionContext) {
  const reader = new NoteReader()

  // Register hover provider for TS/JS files
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      [{ language: 'typescript' }, { language: 'javascript' }],
      new BraitoHoverProvider(reader),
    ),
  )

  // Register file decoration provider
  const decorationProvider = new BraitoDecorationProvider(reader)
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider),
  )

  // Register show note command
  context.subscriptions.push(
    vscode.commands.registerCommand('braito.showNote', () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) return
      NotePanel.show(context.extensionUri, editor.document.uri, reader)
    }),
  )
}

export function deactivate() {}
