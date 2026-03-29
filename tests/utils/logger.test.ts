import { describe, it, expect, beforeEach, spyOn } from 'bun:test'
import { logger } from '../../src/core/utils/logger.ts'

describe('Logger', () => {
  beforeEach(() => {
    // Reset to default state before each test
    logger.setLevel('info')
  })

  describe('setLevel / getLevel', () => {
    it('defaults to info', () => {
      expect(logger.getLevel()).toBe('info')
    })

    it('updates level via setLevel', () => {
      logger.setLevel('debug')
      expect(logger.getLevel()).toBe('debug')
      logger.setLevel('info')
    })

    it('accepts all valid levels', () => {
      for (const level of ['debug', 'info', 'warn', 'error', 'silent'] as const) {
        logger.setLevel(level)
        expect(logger.getLevel()).toBe(level)
      }
    })
  })

  describe('log filtering', () => {
    it('suppresses debug when level is info', () => {
      logger.setLevel('info')
      const spy = spyOn(console, 'log').mockImplementation(() => {})
      logger.debug('should not appear')
      expect(spy.mock.calls.length).toBe(0)
      spy.mockRestore()
    })

    it('emits debug when level is debug', () => {
      logger.setLevel('debug')
      const spy = spyOn(console, 'log').mockImplementation(() => {})
      logger.debug('should appear')
      expect(spy.mock.calls.length).toBe(1)
      spy.mockRestore()
    })

    it('suppresses info when level is error', () => {
      logger.setLevel('error')
      const spy = spyOn(console, 'log').mockImplementation(() => {})
      logger.info('should not appear')
      expect(spy.mock.calls.length).toBe(0)
      spy.mockRestore()
    })

    it('suppresses warn when level is error', () => {
      logger.setLevel('error')
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      logger.warn('should not appear')
      expect(spy.mock.calls.length).toBe(0)
      spy.mockRestore()
    })

    it('emits error at any level except silent', () => {
      for (const level of ['debug', 'info', 'warn', 'error'] as const) {
        logger.setLevel(level)
        const spy = spyOn(console, 'error').mockImplementation(() => {})
        logger.error('should appear')
        expect(spy.mock.calls.length).toBe(1)
        spy.mockRestore()
      }
    })

    it('suppresses all output at silent level', () => {
      logger.setLevel('silent')
      const logSpy = spyOn(console, 'log').mockImplementation(() => {})
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      logger.debug('x')
      logger.info('x')
      logger.warn('x')
      logger.error('x')
      expect(logSpy.mock.calls.length).toBe(0)
      expect(warnSpy.mock.calls.length).toBe(0)
      expect(errorSpy.mock.calls.length).toBe(0)
      logSpy.mockRestore()
      warnSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })

  describe('output methods', () => {
    beforeEach(() => { logger.setLevel('debug') })

    it('info writes to console.log', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {})
      logger.info('hello')
      expect(spy.mock.calls.length).toBe(1)
      spy.mockRestore()
    })

    it('success writes to console.log', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {})
      logger.success('done')
      expect(spy.mock.calls.length).toBe(1)
      spy.mockRestore()
    })

    it('warn writes to console.warn', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      logger.warn('caution')
      expect(spy.mock.calls.length).toBe(1)
      spy.mockRestore()
    })

    it('error writes to console.error', () => {
      const spy = spyOn(console, 'error').mockImplementation(() => {})
      logger.error('oops')
      expect(spy.mock.calls.length).toBe(1)
      spy.mockRestore()
    })

    it('debug writes to console.log', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {})
      logger.debug('trace')
      expect(spy.mock.calls.length).toBe(1)
      spy.mockRestore()
    })

    it('log output includes the message text', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {})
      logger.info('my unique message')
      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('my unique message')
      spy.mockRestore()
    })
  })

  describe('enableTimestamps', () => {
    it('does not throw when called', () => {
      expect(() => logger.enableTimestamps()).not.toThrow()
    })
  })
})
