import type { SourceFile } from 'ts-morph'

export function extractExports(sourceFile: SourceFile): string[] {
  const exports: string[] = []

  for (const decl of sourceFile.getExportedDeclarations()) {
    exports.push(decl[0])
  }

  return exports
}
