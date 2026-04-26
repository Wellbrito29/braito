import { describe, it, expect } from 'bun:test'
import { categorizeFile, typeBoost } from '../../src/core/scoring/categorizeFile.ts'

describe('categorizeFile', () => {
  describe('skip categories', () => {
    it.each([
      'src/foo.test.ts',
      'src/foo.spec.tsx',
      'src/__tests__/bar.ts',
      'src/tests/baz.ts',
    ])('marks %s as skip:test', (p) => {
      const r = categorizeFile(p)
      expect(r.category).toBe('skip:test')
      expect(r.isSkip).toBe(true)
    })

    it.each([
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'tsconfig.build.json',
      '.eslintrc.json',
      'vite.config.ts',
      'next.config.js',
      'tailwind.config.cjs',
    ])('marks %s as skip:config', (p) => {
      const r = categorizeFile(p)
      expect(r.category).toBe('skip:config')
      expect(r.isSkip).toBe(true)
    })

    it.each([
      'src/types.ts',
      'src/foo.d.ts',
      'lib/types.mts',
    ])('marks %s as skip:type-only', (p) => {
      const r = categorizeFile(p)
      expect(r.category).toBe('skip:type-only')
      expect(r.isSkip).toBe(true)
    })

    it.each([
      'dist/index.js',
      'build/main.ts',
      '.next/server/page.js',
      'node_modules/foo/index.ts',
      'coverage/lcov-report/index.html',
    ])('marks %s as skip:generated', (p) => {
      const r = categorizeFile(p)
      expect(r.category).toBe('skip:generated')
      expect(r.isSkip).toBe(true)
    })
  })

  describe('source categories', () => {
    it('marks API route as api-route', () => {
      expect(categorizeFile('app/api/search/route.ts').category).toBe('api-route')
      expect(categorizeFile('app/api/users/[id]/route.ts').category).toBe('api-route')
    })

    it('marks lib files as lib', () => {
      expect(categorizeFile('lib/posts.ts').category).toBe('lib')
      expect(categorizeFile('packages/ui/src/Button.tsx').category).toBe('lib')
    })

    it('marks hook files as hook', () => {
      expect(categorizeFile('app/hooks/useDebounced.ts').category).toBe('hook')
      expect(categorizeFile('useAuth.ts').category).toBe('hook')
    })

    it('marks .tsx files outside lib/api/hook as component', () => {
      expect(categorizeFile('app/components/Button.tsx').category).toBe('component')
      expect(categorizeFile('app/page.tsx').category).toBe('component')
    })

    it('marks plain .ts files as default-source', () => {
      expect(categorizeFile('app/utils/format.ts').category).toBe('default-source')
      expect(categorizeFile('scripts/build.ts').category).toBe('default-source')
    })

    it('all source categories have isSource=true and isSkip=false', () => {
      const sources = [
        'app/api/x/route.ts',
        'lib/x.ts',
        'useFoo.ts',
        'app/c.tsx',
        'app/x.ts',
      ]
      for (const p of sources) {
        const r = categorizeFile(p)
        expect(r.isSkip).toBe(false)
        expect(r.isSource).toBe(true)
      }
    })
  })

  describe('skip wins over source', () => {
    it('test inside lib/ is still a test', () => {
      expect(categorizeFile('lib/foo.test.ts').isSkip).toBe(true)
    })
    it('config in subdirs still wins', () => {
      expect(categorizeFile('packages/ui/tsconfig.json').isSkip).toBe(true)
    })
  })

  describe('aux fallback', () => {
    it('marks markdown as aux', () => {
      expect(categorizeFile('README.md').category).toBe('aux')
      expect(categorizeFile('docs/intro.md').category).toBe('aux')
    })
    it('aux is neither skip nor source', () => {
      const r = categorizeFile('README.md')
      expect(r.isSkip).toBe(false)
      expect(r.isSource).toBe(false)
    })
  })

  describe('windows path normalization', () => {
    it('handles backslashes', () => {
      expect(categorizeFile('app\\components\\Button.tsx').category).toBe('component')
    })
  })
})

describe('typeBoost', () => {
  it('skip categories return -Infinity', () => {
    expect(typeBoost('skip:test')).toBe(Number.NEGATIVE_INFINITY)
    expect(typeBoost('skip:config')).toBe(Number.NEGATIVE_INFINITY)
    expect(typeBoost('skip:type-only')).toBe(Number.NEGATIVE_INFINITY)
    expect(typeBoost('skip:generated')).toBe(Number.NEGATIVE_INFINITY)
  })

  it('api-route gets the highest source boost', () => {
    expect(typeBoost('api-route')).toBeGreaterThan(typeBoost('lib'))
    expect(typeBoost('api-route')).toBeGreaterThan(typeBoost('component'))
  })

  it('aux returns 0', () => {
    expect(typeBoost('aux')).toBe(0)
  })
})
