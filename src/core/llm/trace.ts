import fs from 'node:fs'
import path from 'node:path'

export type TraceEvent = {
  ts: string
  file: string
  provider: string
  model: string
  prompt: string
  response: string
  durationMs: number
  ok: boolean
  error?: string
}

class LLMTracer {
  private filePath: string | null = null

  init(outputDir: string): void {
    this.filePath = path.join(outputDir, '.llm-trace.jsonl')
    // Clear previous trace on each run
    try { fs.writeFileSync(this.filePath, '', 'utf-8') } catch {}
  }

  write(event: TraceEvent): void {
    if (!this.filePath) return
    try {
      fs.appendFileSync(this.filePath, JSON.stringify(event) + '\n', 'utf-8')
    } catch {}
  }

  get path(): string | null {
    return this.filePath
  }
}

export const tracer = new LLMTracer()
