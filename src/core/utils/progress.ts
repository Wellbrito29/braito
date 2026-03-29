export class ProgressBar {
  private total: number
  private current = 0
  private label: string
  private isTTY: boolean

  constructor(total: number, label = 'Processing') {
    this.total = total
    this.label = label
    this.isTTY = process.stderr.isTTY ?? false
  }

  tick(description = ''): void {
    this.current++
    if (!this.isTTY) return  // non-TTY: print nothing (avoid garbled CI output)
    const pct = Math.round((this.current / this.total) * 100)
    const filled = Math.round(pct / 5)
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled)
    const line = `\r  ${this.label} [${bar}] ${pct}% (${this.current}/${this.total}) ${description.slice(0, 30)}`
    process.stderr.write(line)
    if (this.current === this.total) process.stderr.write('\n')
  }

  clear(): void {
    if (this.isTTY) process.stderr.write('\r' + ' '.repeat(80) + '\r')
  }
}
