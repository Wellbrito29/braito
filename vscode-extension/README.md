# braito — VS Code Extension

Surfaces AI-generated operational notes from [braito](https://github.com/Wellbrito29/braito) directly inside VS Code.

## Requirements

Run `braito generate` at least once to populate the `.ai-notes/` directory before using the extension:

```bash
bun src/cli/index.ts generate --root ./
```

The extension activates automatically when a workspace contains a `.ai-notes/` directory.

## Features

### File decorations

Files with a braito sidecar are decorated in the Explorer:

- `⚡` — high criticality (`criticalityScore >= 0.7`)
- `⚠` — note is stale (older than 30 days); run `braito generate` to refresh

Hover over a decorated file to see the exact score.

### Hover provider

Hovering over an import statement in a TypeScript or JavaScript file shows:

- The criticality score of the imported file
- The first purpose line from the sidecar
- A stale warning if the note needs refreshing

Only relative imports (starting with `.`) are resolved.

### Command: braito — Show Note for Current File

Opens a webview panel beside the editor showing the full `.md` sidecar for the active file.

**Keyboard shortcut:** assign one via *File > Preferences > Keyboard Shortcuts* and search for `braito.showNote`.

**Command palette:** `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) → `braito: Show Note for Current File`

## Installation

The extension is not yet published to the VS Code Marketplace. To install locally:

1. Install the VS Code Extension CLI: `npm install -g @vscode/vsce`
2. From `vscode-extension/`: `npm install && npm run compile && vsce package`
3. Install the generated `.vsix`: `code --install-extension braito-0.1.0.vsix`

## Configuration

No configuration required. The extension reads `.ai-notes/` relative to the workspace root automatically.

To adjust the stale threshold, re-run `braito generate` with a custom `staleThresholdDays` in `ai-notes.config.ts`.
