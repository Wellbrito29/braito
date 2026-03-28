import type { SourceFile } from 'ts-morph'

export function extractHooks(sourceFile: SourceFile): string[] {
  const hooks: string[] = []

  for (const fn of sourceFile.getFunctions()) {
    const name = fn.getName()
    if (name && /^use[A-Z]/.test(name)) hooks.push(name)
  }

  for (const stmt of sourceFile.getVariableStatements()) {
    for (const decl of stmt.getDeclarations()) {
      const name = decl.getName()
      if (/^use[A-Z]/.test(name)) hooks.push(name)
    }
  }

  return [...new Set(hooks)]
}
