/**
 * Structured logger with configurable log levels.
 *
 * Levels (ascending severity): debug < info < warn < error
 * Messages below the active level are silenced.
 *
 * Configure via:
 *   logger.setLevel('debug')   // programmatic
 *   --debug CLI flag           // sets level to 'debug'
 *   --silent CLI flag          // sets level to 'error' (suppress info/warn)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

const isTTY = process.stdout.isTTY ?? false

const COLORS = {
  debug: '\x1b[36m',   // cyan
  info:  '\x1b[34m',   // blue
  warn:  '\x1b[33m',   // yellow
  error: '\x1b[31m',   // red
  reset: '\x1b[0m',
  dim:   '\x1b[2m',
  green: '\x1b[32m',
}

function colorize(color: string, text: string): string {
  return isTTY ? `${color}${text}${COLORS.reset}` : text
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 23) // HH:mm:ss.mmm
}

class Logger {
  private level: LogLevel = 'info'
  private showTimestamps = false

  setLevel(level: LogLevel): void {
    this.level = level
  }

  getLevel(): LogLevel {
    return this.level
  }

  enableTimestamps(): void {
    this.showTimestamps = true
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS[level] >= LEVELS[this.level]
  }

  private prefix(level: LogLevel): string {
    const ts = this.showTimestamps ? colorize(COLORS.dim, `${timestamp()} `) : ''
    const tag = colorize(COLORS.dim, '[braito]')
    return `${ts}${tag}`
  }

  debug(msg: string): void {
    if (!this.shouldLog('debug')) return
    console.log(`${this.prefix('debug')} ${colorize(COLORS.debug, 'dbg')} ${msg}`)
  }

  info(msg: string): void {
    if (!this.shouldLog('info')) return
    console.log(`${this.prefix('info')} ${msg}`)
  }

  success(msg: string): void {
    if (!this.shouldLog('info')) return
    console.log(`${this.prefix('info')} ${colorize(COLORS.green, '✓')} ${msg}`)
  }

  warn(msg: string): void {
    if (!this.shouldLog('warn')) return
    console.warn(`${this.prefix('warn')} ${colorize(COLORS.warn, '⚠')} ${msg}`)
  }

  error(msg: string): void {
    if (!this.shouldLog('error')) return
    console.error(`${this.prefix('error')} ${colorize(COLORS.error, '✗')} ${msg}`)
  }
}

export const logger = new Logger()
