import { SyntaxKind, type SourceFile } from 'ts-morph'

const MAX_TYPE_FIELDS = 6

/**
 * Extracts human-readable type signatures for exported symbols.
 * Returns strings like:
 *   buildPrompt(ctx: PromptContext): string
 *   interface AiFileNote { filePath: string; criticalityScore: number; ... }
 *   type StructuredListField = { observed: string[]; inferred: string[]; ... }
 */
export function extractSignatures(sourceFile: SourceFile): string[] {
  const sigs: string[] = []

  // Named functions
  for (const fn of sourceFile.getFunctions()) {
    const name = fn.getName()
    if (!name) continue
    const params = fn.getParameters().map((p) => p.getText()).join(', ')
    const ret = fn.getReturnTypeNode()?.getText()
    sigs.push(`${name}(${params})${ret ? `: ${ret}` : ''}`)
  }

  // Arrow functions assigned to const/let
  for (const stmt of sourceFile.getVariableStatements()) {
    for (const decl of stmt.getDeclarations()) {
      const init = decl.getInitializer()
      if (!init) continue
      if (init.getKind() === SyntaxKind.ArrowFunction) {
        const arrow = init.asKind(SyntaxKind.ArrowFunction)!
        const params = arrow.getParameters().map((p) => p.getText()).join(', ')
        const ret = arrow.getReturnTypeNode()?.getText()
        sigs.push(`${decl.getName()}(${params})${ret ? `: ${ret}` : ''}`)
      }
    }
  }

  // Classes (name + public method signatures)
  for (const cls of sourceFile.getClasses()) {
    const name = cls.getName()
    if (!name) continue
    const methods = cls
      .getMethods()
      .filter((m) => !m.hasModifier(SyntaxKind.PrivateKeyword))
      .slice(0, 5)
      .map((m) => {
        const params = m.getParameters().map((p) => p.getText()).join(', ')
        const ret = m.getReturnTypeNode()?.getText()
        return `${m.getName()}(${params})${ret ? `: ${ret}` : ''}`
      })
    sigs.push(`class ${name} { ${methods.join('; ')} }`)
  }

  // Interfaces
  for (const iface of sourceFile.getInterfaces()) {
    const props = iface
      .getProperties()
      .slice(0, MAX_TYPE_FIELDS)
      .map((p) => {
        const opt = p.hasQuestionToken() ? '?' : ''
        const type = p.getTypeNode()?.getText() ?? 'unknown'
        return `${p.getName()}${opt}: ${type}`
      })
    const ellipsis = iface.getProperties().length > MAX_TYPE_FIELDS ? '; ...' : ''
    sigs.push(`interface ${iface.getName()} { ${props.join('; ')}${ellipsis} }`)
  }

  // Type aliases
  for (const alias of sourceFile.getTypeAliases()) {
    const typeText = alias.getTypeNode()?.getText() ?? 'unknown'
    // Truncate very long type expressions
    const truncated = typeText.length > 120 ? typeText.slice(0, 120) + '...' : typeText
    sigs.push(`type ${alias.getName()} = ${truncated}`)
  }

  // Enums
  for (const enm of sourceFile.getEnums()) {
    const members = enm.getMembers().map((m) => m.getName()).join(', ')
    sigs.push(`enum ${enm.getName()} { ${members} }`)
  }

  return sigs
}
