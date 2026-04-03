import { SyntaxKind, type SourceFile, type FunctionDeclaration, type MethodSignature, type FunctionExpression, type ArrowFunction } from 'ts-morph'

export type ExportDetail = {
  name: string
  signature: string     // e.g. "runGenerate(args: { root?: string; force?: boolean }): Promise<void>"
  kind: 'function' | 'class' | 'type' | 'variable' | 'enum'
  docComment?: string   // first non-empty line of JSDoc/TSDoc, stripped of markers
}

type FunctionLike = FunctionDeclaration | FunctionExpression | ArrowFunction

function buildParamList(fn: FunctionLike): string {
  try {
    return fn.getParameters().map((p) => {
      const name = p.getName()
      const typeNode = p.getTypeNode()
      const type = typeNode ? typeNode.getText() : p.getType().getText()
      const optional = p.isOptional() ? '?' : ''
      // Truncate complex inline types (objects / generics) to keep signatures readable
      const shortType = type.length > 60 ? type.slice(0, 57) + '…' : type
      return `${name}${optional}: ${shortType}`
    }).join(', ')
  } catch {
    return '…'
  }
}

function getReturnType(fn: FunctionLike): string {
  try {
    const ret = fn.getReturnTypeNode()
    if (ret) {
      const t = ret.getText()
      return t.length > 50 ? t.slice(0, 47) + '…' : t
    }
    return ''
  } catch {
    return ''
  }
}

function firstJsDocLine(node: { getJsDocs?: () => Array<{ getDescription(): string }> }): string | undefined {
  try {
    const docs = node.getJsDocs?.()
    if (!docs || docs.length === 0) return undefined
    const desc = docs[docs.length - 1].getDescription().trim()
    const firstLine = desc.split('\n').find((l) => l.trim().length > 0)
    return firstLine?.trim() ?? undefined
  } catch {
    return undefined
  }
}

export function extractExportDetails(sourceFile: SourceFile): ExportDetail[] {
  const details: ExportDetail[] = []
  const seen = new Set<string>()

  // Exported function declarations
  for (const fn of sourceFile.getFunctions()) {
    if (!fn.isExported()) continue
    const name = fn.getName()
    if (!name || seen.has(name)) continue
    seen.add(name)
    const params = buildParamList(fn)
    const ret = getReturnType(fn)
    const signature = ret ? `${name}(${params}): ${ret}` : `${name}(${params})`
    details.push({ name, signature, kind: 'function', docComment: firstJsDocLine(fn) })
  }

  // Exported classes
  for (const cls of sourceFile.getClasses()) {
    if (!cls.isExported()) continue
    const name = cls.getName()
    if (!name || seen.has(name)) continue
    seen.add(name)
    const doc = firstJsDocLine(cls)
    details.push({ name, signature: `class ${name}`, kind: 'class', docComment: doc })
  }

  // Exported type aliases and interfaces
  for (const typeAlias of sourceFile.getTypeAliases()) {
    if (!typeAlias.isExported()) continue
    const name = typeAlias.getName()
    if (seen.has(name)) continue
    seen.add(name)
    details.push({ name, signature: `type ${name}`, kind: 'type', docComment: firstJsDocLine(typeAlias) })
  }

  for (const iface of sourceFile.getInterfaces()) {
    if (!iface.isExported()) continue
    const name = iface.getName()
    if (seen.has(name)) continue
    seen.add(name)
    details.push({ name, signature: `interface ${name}`, kind: 'type', docComment: firstJsDocLine(iface) })
  }

  // Exported enums
  for (const enm of sourceFile.getEnums()) {
    if (!enm.isExported()) continue
    const name = enm.getName()
    if (seen.has(name)) continue
    seen.add(name)
    details.push({ name, signature: `enum ${name}`, kind: 'enum', docComment: firstJsDocLine(enm) })
  }

  // Exported const arrow functions
  for (const stmt of sourceFile.getVariableStatements()) {
    if (!stmt.isExported()) continue
    for (const decl of stmt.getDeclarations()) {
      const name = decl.getName()
      if (seen.has(name)) continue
      const init = decl.getInitializer()
      if (!init) continue
      if (
        init.getKind() === SyntaxKind.ArrowFunction ||
        init.getKind() === SyntaxKind.FunctionExpression
      ) {
        const fn = init as ArrowFunction | FunctionExpression
        const params = buildParamList(fn)
        const ret = getReturnType(fn)
        const signature = ret ? `${name}(${params}): ${ret}` : `${name}(${params})`
        seen.add(name)
        details.push({ name, signature, kind: 'function', docComment: firstJsDocLine(stmt) })
      }
    }
  }

  return details
}
