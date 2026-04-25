import type { LLMProvider, LLMRequest, LLMResponse } from './types.ts'
import { withRetry } from '../retry.ts'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFile, unlink } from 'node:fs/promises'

const DEFAULT_BINARY = 'codex'

/**
 * CodexCliProvider — invokes the OpenAI Codex CLI (`codex exec`) as an
 * LLM backend. Modeled after ClaudeCliProvider: spawn subprocess, pipe
 * the prompt via stdin, read the final assistant message from a file
 * written by `--output-last-message`.
 *
 * Codex exec does not expose a `--system-prompt` flag (as of 0.125.0),
 * so the system prompt is prepended to the user prompt with a clear
 * separator. Codex exec honors the full concatenated text as a single
 * turn. Output-last-message strips the TUI noise that goes to stdout.
 */
export class CodexCliProvider implements LLMProvider {
  private binaryPath: string
  private model?: string

  constructor(opts: { model?: string; binaryPath?: string } = {}) {
    this.binaryPath = opts.binaryPath ?? DEFAULT_BINARY
    this.model = opts.model
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    return withRetry(async () => {
      const outFile = join(tmpdir(), `codex-braito-${randomUUID()}.txt`)
      const startedAt = performance.now()

      const fullPrompt = `${request.system}\n\n---\n\n${request.user}`

      const args = [
        'exec',
        '--skip-git-repo-check',
        '--output-last-message', outFile,
      ]
      if (this.model) {
        args.push('-c', `model="${this.model}"`)
      }

      const proc = Bun.spawn([this.binaryPath, ...args], {
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'pipe',
      })

      proc.stdin.write(fullPrompt)
      await proc.stdin.end()

      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ])

      if (exitCode !== 0) {
        throw new Error(
          `Codex CLI exited with code ${exitCode}: ${stderr.trim() || stdout.trim()}`,
        )
      }

      let content: string
      try {
        content = (await readFile(outFile, 'utf-8')).trim()
      } catch (err) {
        throw new Error(`Codex CLI did not write output file: ${(err as Error).message}`)
      } finally {
        await unlink(outFile).catch(() => {})
      }

      if (!content) {
        throw new Error('Codex CLI returned empty output')
      }

      return {
        content,
        model: this.model ?? 'codex-default',
        usage: {
          durationMs: performance.now() - startedAt,
        },
      }
    })
  }
}
