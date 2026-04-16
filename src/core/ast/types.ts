import type { StaticFileAnalysis } from '../types/file-analysis.ts'
import type { AnalysisConfig } from '../types/project.ts'

/**
 * Common interface for all language analyzers.
 * Each language implements this contract and is registered in analyzerRegistry.ts.
 */
export interface LanguageAnalyzer {
  /** File extensions this analyzer handles (e.g. ['.py']) */
  readonly extensions: string[]
  /** Analyze a file and return a StaticFileAnalysis */
  analyze(filePath: string, content: string, analysisConfig?: AnalysisConfig): StaticFileAnalysis
}
