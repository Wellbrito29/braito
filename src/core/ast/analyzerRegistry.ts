import type { LanguageAnalyzer } from './types.ts'
import { pythonAnalyzer } from './analyzers/python/pythonAnalyzer.ts'
import { goAnalyzer } from './analyzers/go/goAnalyzer.ts'

const registry = new Map<string, LanguageAnalyzer>()

function register(analyzer: LanguageAnalyzer): void {
  for (const ext of analyzer.extensions) {
    registry.set(ext, analyzer)
  }
}

register(pythonAnalyzer)
register(goAnalyzer)

/**
 * Returns the analyzer for the given file extension, or null if unsupported.
 * TypeScript/JavaScript files are handled separately by parseFile.ts (ts-morph).
 */
export function getAnalyzer(ext: string): LanguageAnalyzer | null {
  return registry.get(ext) ?? null
}

export function supportedExtensions(): string[] {
  return [...registry.keys()]
}
