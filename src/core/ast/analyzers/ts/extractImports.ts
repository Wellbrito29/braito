import type { SourceFile } from 'ts-morph'

export type ExtractedImports = {
  all: string[]
  local: string[]
  external: string[]
}

export function extractImports(sourceFile: SourceFile): ExtractedImports {
  const all: string[] = []
  const local: string[] = []
  const external: string[] = []

  for (const decl of sourceFile.getImportDeclarations()) {
    const specifier = decl.getModuleSpecifierValue()
    all.push(specifier)

    if (specifier.startsWith('.') || specifier.startsWith('@/') || specifier.startsWith('~/')) {
      local.push(specifier)
    } else {
      external.push(specifier)
    }
  }

  return { all, local, external }
}
