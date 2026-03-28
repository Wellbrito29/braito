export const logger = {
  info: (msg: string) => console.log(`[braito] ${msg}`),
  success: (msg: string) => console.log(`[braito] ✓ ${msg}`),
  warn: (msg: string) => console.warn(`[braito] ⚠ ${msg}`),
  error: (msg: string) => console.error(`[braito] ✗ ${msg}`),
}
