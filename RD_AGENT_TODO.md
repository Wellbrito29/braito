# RD Autonomous Agents — braito Integration TODO

This file documents exactly what needs to be done in the `rd-autonomous-agents` repository
to integrate braito as a codebase context provider for the AI agents.

## Overview

braito runs as a sidecar service alongside the orchestrator. When the pipeline clones a
target repository to a workspace, braito generates structured notes for each file. The agents
then query braito's MCP server for architectural context before making code decisions.

```
GitHub Issue
    │
    ▼
PM Agent (classify demand)
    │
    ▼
[braito: generate notes for cloned repo] ──── new step
    │
    ▼
Architect Agent  ──── calls braito MCP: get_architecture_context()
    │
    ▼
Developer Agent  ──── calls braito MCP: get_file_note(path) before editing
    │
    ▼
Quality Gates
    │
    ▼
Create PR
```

---

## Step 1 — Add braito to Docker Compose

In `docker-compose.yml`, add a braito service that shares the workspace volume:

```yaml
services:
  braito:
    image: oven/bun:1.3
    working_dir: /app
    volumes:
      - ./braito:/app          # clone braito repo here, or use a built image
      - workspaces:/workspaces # shared volume with backend
    command: >
      sh -c "bun src/cli/index.ts mcp --root /workspaces/$${TARGET_REPO} --auto-generate"
    environment:
      - TARGET_REPO=${TARGET_REPO:-target}
    stdin_open: true
    tty: false

volumes:
  workspaces:
```

Or if you prefer running braito as a CLI subprocess (no persistent service), skip this step
and call braito directly from Go — see Step 3b.

---

## Step 2 — Add braito to the workspace setup

In `internal/github/workspace.go` (or wherever you clone repos to `/tmp`), after cloning
the target repository, run braito generate:

```go
// After git clone completes:
func (w *WorkspaceManager) setupBraito(ctx context.Context, workspacePath string) error {
    // Check if braito CLI is available
    braitoPath := os.Getenv("BRAITO_CLI_PATH") // e.g. "/app/braito/src/cli/index.ts"
    if braitoPath == "" {
        return nil // braito is optional
    }

    cmd := exec.CommandContext(ctx, "bun", braitoPath, "generate",
        "--root", workspacePath,
        "--silent",  // suppress output in logs
    )
    cmd.Dir = workspacePath

    if err := cmd.Run(); err != nil {
        // non-fatal: agents can still work without notes
        log.Warn("braito generate failed", "err", err, "workspace", workspacePath)
    }
    return nil
}
```

Environment variable to add to `.env`:
```env
BRAITO_CLI_PATH=/app/braito/src/cli/index.ts
BRAITO_ENABLED=true
```

---

## Step 3a — MCP client in Go (persistent subprocess)

Create `internal/braito/client.go`:

```go
package braito

import (
    "bufio"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "os"
    "os/exec"
    "sync"
    "sync/atomic"
)

type Client struct {
    cmd    *exec.Cmd
    stdin  io.WriteCloser
    reader *bufio.Scanner
    mu     sync.Mutex
    idSeq  atomic.Int64
}

type Request struct {
    JSONRPC string         `json:"jsonrpc"`
    ID      int64          `json:"id"`
    Method  string         `json:"method"`
    Params  map[string]any `json:"params,omitempty"`
}

type Response struct {
    JSONRPC string         `json:"jsonrpc"`
    ID      int64          `json:"id"`
    Result  map[string]any `json:"result,omitempty"`
    Error   *RPCError      `json:"error,omitempty"`
}

type RPCError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

// NewClient starts the braito MCP server as a subprocess.
// workspacePath is the cloned target repository root.
func NewClient(ctx context.Context, workspacePath string) (*Client, error) {
    braitoPath := os.Getenv("BRAITO_CLI_PATH")
    if braitoPath == "" {
        return nil, fmt.Errorf("BRAITO_CLI_PATH not set")
    }

    cmd := exec.CommandContext(ctx, "bun", braitoPath, "mcp",
        "--root", workspacePath,
        "--auto-generate",
    )

    stdin, err := cmd.StdinPipe()
    if err != nil {
        return nil, err
    }

    stdout, err := cmd.StdoutPipe()
    if err != nil {
        return nil, err
    }

    if err := cmd.Start(); err != nil {
        return nil, fmt.Errorf("failed to start braito: %w", err)
    }

    c := &Client{
        cmd:    cmd,
        stdin:  stdin,
        reader: bufio.NewScanner(stdout),
    }

    // Initialize
    if _, err := c.call("initialize", nil); err != nil {
        _ = c.Close()
        return nil, fmt.Errorf("braito initialize failed: %w", err)
    }

    return c, nil
}

func (c *Client) call(method string, params map[string]any) (map[string]any, error) {
    c.mu.Lock()
    defer c.mu.Unlock()

    id := c.idSeq.Add(1)
    req := Request{JSONRPC: "2.0", ID: id, Method: method, Params: params}
    data, err := json.Marshal(req)
    if err != nil {
        return nil, err
    }

    if _, err := fmt.Fprintf(c.stdin, "%s\n", data); err != nil {
        return nil, err
    }

    if !c.reader.Scan() {
        return nil, fmt.Errorf("braito: EOF reading response")
    }

    var resp Response
    if err := json.Unmarshal(c.reader.Bytes(), &resp); err != nil {
        return nil, err
    }
    if resp.Error != nil {
        return nil, fmt.Errorf("braito RPC error %d: %s", resp.Error.Code, resp.Error.Message)
    }

    return resp.Result, nil
}

// GetArchitectureContext returns a synthesized architectural overview.
// Call this at the start of the Architect agent phase.
func (c *Client) GetArchitectureContext(ctx context.Context, topN int) (map[string]any, error) {
    return c.call("tools/call", map[string]any{
        "name":      "get_architecture_context",
        "arguments": map[string]any{"top_n": topN},
    })
}

// GetFileNote returns the braito note for a specific file.
// Call this in the Developer agent before editing a file.
func (c *Client) GetFileNote(ctx context.Context, filePath string) (map[string]any, error) {
    return c.call("tools/call", map[string]any{
        "name":      "get_file_note",
        "arguments": map[string]any{"file_path": filePath},
    })
}

// SearchByCriticality returns files above a criticality threshold.
func (c *Client) SearchByCriticality(ctx context.Context, threshold float64, limit int) (map[string]any, error) {
    return c.call("tools/call", map[string]any{
        "name":      "search_by_criticality",
        "arguments": map[string]any{"threshold": threshold, "limit": limit},
    })
}

func (c *Client) Close() error {
    _ = c.stdin.Close()
    return c.cmd.Wait()
}
```

---

## Step 3b — CLI subprocess (simpler, no persistent process)

If you prefer simpler integration without a persistent subprocess, call braito as a one-shot
CLI command and parse the output:

```go
func GetArchitectureContextCLI(ctx context.Context, workspacePath string) ([]byte, error) {
    braitoPath := os.Getenv("BRAITO_CLI_PATH")
    
    // Write a JSON-RPC request and pipe it to braito mcp
    request := `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}` + "\n" +
        `{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_architecture_context","arguments":{"top_n":10}}}` + "\n"

    cmd := exec.CommandContext(ctx, "bun", braitoPath, "mcp", "--root", workspacePath)
    cmd.Stdin = strings.NewReader(request)
    return cmd.Output()
}
```

---

## Step 4 — Wire into the Architect Agent

In `internal/agents/architect.go`, before building the architecture prompt:

```go
func (a *ArchitectAgent) Run(ctx context.Context, input *contracts.PMOutput) (*contracts.ArchitectOutput, error) {
    // Get braito context if available
    var braitoContext string
    if a.braito != nil {
        result, err := a.braito.GetArchitectureContext(ctx, 10)
        if err == nil {
            if content, ok := result["content"].([]any); ok && len(content) > 0 {
                if item, ok := content[0].(map[string]any); ok {
                    braitoContext = fmt.Sprintf("\n\n## Codebase Architecture Context (from braito)\n%s", item["text"])
                }
            }
        }
    }

    prompt := a.buildPrompt(input, braitoContext)
    // ... rest of architect logic
}
```

Add to the Architect system prompt template:
```
{{if .BraitoContext}}
## Codebase Architecture Context

The following is a machine-generated analysis of the target repository.
Use it to understand which files are most critical, what invariants must
be preserved, and what areas carry known pitfalls.

{{.BraitoContext}}
{{end}}
```

---

## Step 5 — Wire into the Developer Agent

In `internal/agents/developer.go`, before editing each file:

```go
func (d *DeveloperAgent) editFile(ctx context.Context, filePath string) error {
    // Get braito note for this file
    var fileContext string
    if d.braito != nil {
        result, err := d.braito.GetFileNote(ctx, filePath)
        if err == nil {
            if content, ok := result["content"].([]any); ok && len(content) > 0 {
                if item, ok := content[0].(map[string]any); ok {
                    fileContext = fmt.Sprintf("File context:\n%s\n\n", item["text"])
                }
            }
        }
    }

    prompt := fmt.Sprintf("%sMake the following changes to %s:\n%s", fileContext, filePath, d.changeSpec)
    // ... call LLM
}
```

---

## Step 6 — Initialize braito client in the orchestrator

In `internal/orchestrator/v2.go` (BMAD pipeline), after workspace setup:

```go
type V2Orchestrator struct {
    // ... existing fields
    braito *braito.Client // add this
}

func (o *V2Orchestrator) Run(ctx context.Context, event *GitHubEvent) error {
    // Clone repo
    workspacePath, err := o.workspace.Clone(ctx, event.Repo)
    if err != nil {
        return err
    }
    defer o.workspace.Cleanup(workspacePath)

    // Start braito sidecar (non-fatal if unavailable)
    var braitoClient *braito.Client
    if os.Getenv("BRAITO_ENABLED") == "true" {
        braitoClient, err = braito.NewClient(ctx, workspacePath)
        if err != nil {
            log.Warn("braito unavailable", "err", err)
        } else {
            defer braitoClient.Close()
        }
    }

    // Pass to agents
    architect := NewArchitectAgent(o.llm, braitoClient)
    developer := NewDeveloperAgent(o.llm, braitoClient)
    // ...
}
```

---

## Step 7 — Environment variables to add

In `.env` / `docker-compose.yml`:

```env
# Enable braito integration
BRAITO_ENABLED=true

# Path to braito CLI (inside container or local)
BRAITO_CLI_PATH=/app/braito/src/cli/index.ts

# Optional: pass LLM API key to braito for synthesis
# If not set, braito runs in static-only mode (still useful)
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

---

## Step 8 — GitHub Action on target repos (optional but recommended)

Add this workflow to each target repository so notes are always pre-generated:

```yaml
# .github/workflows/braito.yml
name: braito — update AI notes

on:
  push:
    branches: [main, master]
    paths: ['src/**', 'internal/**', '**/*.go', '**/*.ts']

jobs:
  braito:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2

      - name: Clone braito
        run: git clone https://github.com/Wellbrito29/braito.git /tmp/braito

      - name: Install braito deps
        run: cd /tmp/braito && bun install

      - name: Generate notes
        run: bun /tmp/braito/src/cli/index.ts generate --root ./ --silent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Commit notes
        run: |
          git config user.name "braito"
          git config user.email "braito@bot"
          git add .ai-notes/
          git diff --cached --quiet || git commit -m "chore: update AI notes"
          git push
```

With this in place, the rd-autonomous-agents workspace always has fresh notes as soon as it
clones the target repo — no need to run generate at runtime.

---

## Priority order

1. **Step 2** — workspace setup (generate on clone) — most impactful, least invasive
2. **Step 3a** — braito MCP client in Go
3. **Step 4** — Architect agent context
4. **Step 5** — Developer agent per-file context
5. **Step 6** — orchestrator wiring
6. **Step 7** — environment variables
7. **Step 8** — GitHub Action on target repos (longer term)

Steps 1 (Docker) and 8 (GitHub Action) are optional enhancements.
