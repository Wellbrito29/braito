import type { Request, Response, NextFunction } from 'express'

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const logLevel = process.env.LOG_LEVEL ?? 'info'
  const serviceName = process.env.SERVICE_NAME ?? 'unknown'
  if (logLevel === 'debug') {
    console.log(`[${serviceName}] ${req.method} ${req.url}`)
  }
  next()
}
