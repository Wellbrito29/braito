import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { goAnalyzer, getGoModuleName } from '../../src/core/ast/analyzers/go/goAnalyzer.ts'

const SAMPLE = `
package main

import (
    "fmt"
    "net/http"
    "os"
)

// NOTE: chose net/http over fasthttp for stdlib compatibility
// TODO: add timeout handling

type Config struct {
    BaseURL string
}

func FetchData(url string) (*http.Response, error) {
    apiKey := os.Getenv("API_KEY")
    _ = apiKey
    return http.Get("https://api.example.com/data")
}

func privateHelper() {}

var BaseURL = "https://example.com"
`.trim()

// Sample with module-relative imports
const SAMPLE_WITH_LOCAL = `
package server

import (
    "fmt"
    "github.com/org/myrepo/internal/config"
    "github.com/org/myrepo/pkg/util"
    "github.com/third-party/library"
)

func Start() {
    fmt.Println("starting")
}
`.trim()

describe('goAnalyzer', () => {
  it('handles .go extension', () => {
    expect(goAnalyzer.extensions).toContain('.go')
  })

  it('extracts imports from import block', () => {
    const result = goAnalyzer.analyze('/project/main.go', SAMPLE)
    expect(result.imports).toContain('fmt')
    expect(result.imports).toContain('net/http')
    expect(result.imports).toContain('os')
  })

  it('extracts exported functions (uppercase)', () => {
    const result = goAnalyzer.analyze('/project/main.go', SAMPLE)
    expect(result.exports).toContain('FetchData')
  })

  it('does not export private functions (lowercase)', () => {
    const result = goAnalyzer.analyze('/project/main.go', SAMPLE)
    expect(result.exports).not.toContain('privateHelper')
  })

  it('extracts exported types', () => {
    const result = goAnalyzer.analyze('/project/main.go', SAMPLE)
    expect(result.exports).toContain('Config')
  })

  it('extracts env vars via os.Getenv', () => {
    const result = goAnalyzer.analyze('/project/main.go', SAMPLE)
    expect(result.envVars).toContain('API_KEY')
  })

  it('extracts API calls via http.Get', () => {
    const result = goAnalyzer.analyze('/project/main.go', SAMPLE)
    expect(result.apiCalls).toContain('https://api.example.com/data')
  })

  it('captures TODO comments', () => {
    const result = goAnalyzer.analyze('/project/main.go', SAMPLE)
    expect(result.comments.todo.some((t) => t.includes('timeout'))).toBe(true)
  })

  it('captures NOTE as decision comment', () => {
    const result = goAnalyzer.analyze('/project/main.go', SAMPLE)
    expect(result.comments.decision.some((d) => d.includes('net/http'))).toBe(true)
  })
})

describe('goAnalyzer — go.mod module-relative import detection', () => {
  let tmpDir: string
  let goFile: string

  beforeAll(() => {
    // Create a temp directory with a go.mod file
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-go-test-'))
    fs.writeFileSync(
      path.join(tmpDir, 'go.mod'),
      'module github.com/org/myrepo\n\ngo 1.21\n',
      'utf8',
    )
    const subDir = path.join(tmpDir, 'cmd', 'server')
    fs.mkdirSync(subDir, { recursive: true })
    goFile = path.join(subDir, 'main.go')
    fs.writeFileSync(goFile, SAMPLE_WITH_LOCAL, 'utf8')
  })

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('getGoModuleName finds go.mod walking up from a nested file', () => {
    const name = getGoModuleName(goFile)
    expect(name).toBe('github.com/org/myrepo')
  })

  it('classifies module-relative imports as local', () => {
    const result = goAnalyzer.analyze(goFile, SAMPLE_WITH_LOCAL)
    expect(result.localImports).toContain('github.com/org/myrepo/internal/config')
    expect(result.localImports).toContain('github.com/org/myrepo/pkg/util')
  })

  it('does not classify third-party imports as local', () => {
    const result = goAnalyzer.analyze(goFile, SAMPLE_WITH_LOCAL)
    expect(result.localImports).not.toContain('github.com/third-party/library')
    expect(result.localImports).not.toContain('fmt')
  })

  it('classifies third-party and stdlib imports as external', () => {
    const result = goAnalyzer.analyze(goFile, SAMPLE_WITH_LOCAL)
    expect(result.externalImports).toContain('github.com/third-party/library')
    expect(result.externalImports).toContain('fmt')
  })

  it('does not classify local imports as external', () => {
    const result = goAnalyzer.analyze(goFile, SAMPLE_WITH_LOCAL)
    expect(result.externalImports).not.toContain('github.com/org/myrepo/internal/config')
    expect(result.externalImports).not.toContain('github.com/org/myrepo/pkg/util')
  })
})

describe('goAnalyzer — fallback when no go.mod present', () => {
  it('getGoModuleName returns null when no go.mod is found', () => {
    // Use a path that definitely won't have go.mod above it (temp dir with no go.mod)
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-no-gomod-'))
    try {
      const result = getGoModuleName(path.join(tmpDir, 'main.go'))
      expect(result).toBeNull()
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('falls back to ./ and ../ heuristics without go.mod', () => {
    // Provide a fake path with no go.mod anywhere
    const fakePath = '/tmp/braito-no-gomod-fallback-xyz/pkg/main.go'
    const content = `
package pkg

import (
    "./local"
    "../sibling"
    "fmt"
    "github.com/external/lib"
)
`.trim()
    const result = goAnalyzer.analyze(fakePath, content)
    expect(result.localImports).toContain('./local')
    expect(result.localImports).toContain('../sibling')
    expect(result.externalImports).toContain('fmt')
    expect(result.externalImports).toContain('github.com/external/lib')
  })
})
