import { describe, it, expect } from 'bun:test'
import { goAnalyzer } from '../../src/core/ast/analyzers/go/goAnalyzer.ts'

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
