import { describe, it, expect } from 'bun:test'
import { pythonAnalyzer } from '../../src/core/ast/analyzers/python/pythonAnalyzer.ts'

const SAMPLE = `
import os
import sys
from pathlib import Path
from .utils import helper

# NOTE: chose requests over httpx for compatibility
# TODO: add retry logic

def fetch_data(url: str):
    key = os.environ['API_KEY']
    return requests.get(f'https://api.example.com/data')

class DataLoader:
    def load(self):
        pass

def _private():
    pass
`.trim()

describe('pythonAnalyzer', () => {
  it('handles .py extension', () => {
    expect(pythonAnalyzer.extensions).toContain('.py')
  })

  it('extracts external imports', () => {
    const result = pythonAnalyzer.analyze('/project/src/loader.py', SAMPLE)
    expect(result.externalImports).toContain('os')
    expect(result.externalImports).toContain('sys')
  })

  it('extracts local imports', () => {
    const result = pythonAnalyzer.analyze('/project/src/loader.py', SAMPLE)
    expect(result.localImports).toContain('.utils')
  })

  it('extracts exported symbols (public defs and classes)', () => {
    const result = pythonAnalyzer.analyze('/project/src/loader.py', SAMPLE)
    expect(result.exports).toContain('fetch_data')
    expect(result.exports).toContain('DataLoader')
  })

  it('extracts env vars', () => {
    const result = pythonAnalyzer.analyze('/project/src/loader.py', SAMPLE)
    expect(result.envVars).toContain('API_KEY')
  })

  it('captures TODO comments', () => {
    const result = pythonAnalyzer.analyze('/project/src/loader.py', SAMPLE)
    expect(result.comments.todo.some((t) => t.includes('retry logic'))).toBe(true)
  })

  it('captures NOTE as decision comment', () => {
    const result = pythonAnalyzer.analyze('/project/src/loader.py', SAMPLE)
    expect(result.comments.decision.some((d) => d.includes('requests'))).toBe(true)
  })

  it('returns empty hooks (Python has no hooks concept)', () => {
    const result = pythonAnalyzer.analyze('/project/src/loader.py', SAMPLE)
    expect(result.hooks).toHaveLength(0)
  })
})
