import { SyntaxKind, type SourceFile } from 'ts-morph'

export function extractSymbols(sourceFile: SourceFile): string[] {
  const symbols: string[] = []

  for (const fn of sourceFile.getFunctions()) {
    const name = fn.getName()
    if (name) symbols.push(name)
  }

  for (const cls of sourceFile.getClasses()) {
    const name = cls.getName()
    if (name) symbols.push(name)
  }

  for (const enm of sourceFile.getEnums()) {
    symbols.push(enm.getName())
  }

  for (const stmt of sourceFile.getVariableStatements()) {
    for (const decl of stmt.getDeclarations()) {
      const name = decl.getName()
      const init = decl.getInitializer()
      // only include arrow functions and objects, not primitive values
      if (
        init &&
        (init.getKind() === SyntaxKind.ArrowFunction ||
          init.getKind() === SyntaxKind.ObjectLiteralExpression)
      ) {
        symbols.push(name)
      }
    }
  }

  return [...new Set(symbols)]
}
