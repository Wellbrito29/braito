import type { LLMProvider, LLMRequest, LLMResponse } from './types.ts'
import { withRetry } from '../retry.ts'

const DEFAULT_MODEL = 'claude-sonnet-4-6'
const DEFAULT_BINARY = 'claude'

type ClaudeCliJsonResult = {
  type: string
  subtype?: string
  result?: string
  is_error?: boolean
  total_cost_usd?: number
  duration_ms?: number
}

export class ClaudeCliProvider implements LLMProvider {
  private model: string
  private binaryPath: string

  constructor(opts: { model?: string; binaryPath?: string } = {}) {
    this.model = opts.model ?? DEFAULT_MODEL
    this.binaryPath = opts.binaryPath ?? DEFAULT_BINARY
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    return withRetry(async () => {
      // Use --system-prompt (not --append-system-prompt) to fully replace the
      // default system prompt, which includes user memory and env info that
      // would bias synthesis (e.g. language preferences, personal context).
      const proc = Bun.spawn(
        [
          this.binaryPath,
          '-p',
          '--output-format', 'json',
          '--system-prompt', request.system,
          '--model', this.model,
        ],
        {
          stdin: 'pipe',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      )

      proc.stdin.write(request.user)
      await proc.stdin.end()

      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ])

      if (exitCode !== 0) {
        throw new Error(
          `Claude CLI exited with code ${exitCode}: ${stderr.trim() || stdout.trim()}`,
        )
      }

      let parsed: ClaudeCliJsonResult
      try {
        parsed = JSON.parse(stdout) as ClaudeCliJsonResult
      } catch {
        throw new Error(`Claude CLI returned non-JSON output: ${stdout.slice(0, 500)}`)
      }

      if (parsed.is_error || parsed.subtype !== 'success' || typeof parsed.result !== 'string') {
        throw new Error(`Claude CLI returned error: ${stdout.slice(0, 500)}`)
      }

      return {
        content: parsed.result,
        model: this.model,
        usage: {
          durationMs: parsed.duration_ms,
          costUsd: parsed.total_cost_usd,
        },
      }
    })
  }
}
