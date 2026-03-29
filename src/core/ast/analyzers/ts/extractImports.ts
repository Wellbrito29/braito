import type { SourceFile } from 'ts-morph'
import { SyntaxKind } from 'ts-morph'

export type ExtractedImports = {
  all: string[]
  local: string[]
  external: string[]
}

function classifySpecifier(
  specifier: string,
  all: string[],
  local: string[],
  external: string[],
): void {
  all.push(specifier)
  if (specifier.startsWith('.') || specifier.startsWith('@/') || specifier.startsWith('~/')) {
    local.push(specifier)
  } else {
    external.push(specifier)
  }
}

export function extractImports(sourceFile: SourceFile): ExtractedImports {
  const all: string[] = []
  const local: string[] = []
  const external: string[] = []

  // Static imports: import { foo } from './foo'
  for (const decl of sourceFile.getImportDeclarations()) {
    classifySpecifier(decl.getModuleSpecifierValue(), all, local, external)
  }

  // Dynamic imports: import('./path') or import("./path") or import(`./path`)
  for (const callExpr of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expr = callExpr.getExpression()
    if (expr.getKind() !== SyntaxKind.ImportKeyword) continue

    const args = callExpr.getArguments()
    if (args.length === 0) continue

    const firstArg = args[0]
    // Only handle string literals (static paths); skip template expressions with variables
    if (
      firstArg.getKind() === SyntaxKind.StringLiteral ||
      firstArg.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral
    ) {
      const specifier = firstArg.getText().slice(1, -1) // strip surrounding quotes
      classifySpecifier(specifier, all, local, external)
    }
  }

  return { all, local, external }
}
