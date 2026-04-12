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

  it('returns signatures array', () => {
    const result = pythonAnalyzer.analyze('/project/src/loader.py', SAMPLE)
    expect(result.signatures).toBeDefined()
    expect(result.signatures.length).toBeGreaterThan(0)
  })
})

describe('pythonAnalyzer — exportDetails', () => {
  it('extracts function signatures with params and return type', () => {
    const code = `
def add(a: int, b: int) -> int:
    return a + b
`.trim()
    const result = pythonAnalyzer.analyze('/project/math.py', code)
    expect(result.exportDetails).toHaveLength(1)
    expect(result.exportDetails[0].name).toBe('add')
    expect(result.exportDetails[0].signature).toBe('def add(a: int, b: int) -> int')
    expect(result.exportDetails[0].kind).toBe('function')
  })

  it('extracts async function signatures', () => {
    const code = `
async def fetch(url: str) -> dict:
    pass
`.trim()
    const result = pythonAnalyzer.analyze('/project/api.py', code)
    expect(result.exportDetails).toHaveLength(1)
    expect(result.exportDetails[0].signature).toBe('async def fetch(url: str) -> dict')
    expect(result.exportDetails[0].kind).toBe('function')
  })

  it('extracts class with bases and docstring', () => {
    const code = `
class UserService(BaseService):
    """Handles user CRUD operations"""
    def create(self):
        pass
`.trim()
    const result = pythonAnalyzer.analyze('/project/service.py', code)
    const cls = result.exportDetails.find((d) => d.name === 'UserService')
    expect(cls).toBeDefined()
    expect(cls!.signature).toBe('class UserService(BaseService)')
    expect(cls!.kind).toBe('class')
    expect(cls!.docComment).toBe('Handles user CRUD operations')
  })

  it('extracts function docstrings', () => {
    const code = `
def process(data: list) -> bool:
    """Process the incoming data batch"""
    return True
`.trim()
    const result = pythonAnalyzer.analyze('/project/proc.py', code)
    expect(result.exportDetails[0].docComment).toBe('Process the incoming data batch')
  })

  it('populates signatures from exportDetails', () => {
    const code = `
def foo(x: int) -> str:
    pass

class Bar:
    pass
`.trim()
    const result = pythonAnalyzer.analyze('/project/mod.py', code)
    expect(result.signatures).toContain('def foo(x: int) -> str')
    expect(result.signatures).toContain('class Bar')
  })
})

describe('pythonAnalyzer — __all__', () => {
  it('filters exports when __all__ is defined', () => {
    const code = `
__all__ = ['public_func']

def public_func():
    pass

def hidden_func():
    pass

class HiddenClass:
    pass
`.trim()
    const result = pythonAnalyzer.analyze('/project/mod.py', code)
    expect(result.exports).toContain('public_func')
    expect(result.exports).not.toContain('hidden_func')
    expect(result.exports).not.toContain('HiddenClass')
    expect(result.exportDetails).toHaveLength(1)
    expect(result.exportDetails[0].name).toBe('public_func')
  })
})

describe('pythonAnalyzer — multiline imports', () => {
  it('extracts imports from multiline from...import blocks', () => {
    const code = `
from collections import (
    OrderedDict,
    defaultdict,
)
from os import path
`.trim()
    const result = pythonAnalyzer.analyze('/project/util.py', code)
    expect(result.imports).toContain('collections')
    expect(result.imports).toContain('os')
  })

  it('extracts relative multiline imports as local', () => {
    const code = `
from .models import (
    User,
    Role,
)
`.trim()
    const result = pythonAnalyzer.analyze('/project/views.py', code)
    expect(result.localImports).toContain('.models')
  })
})
