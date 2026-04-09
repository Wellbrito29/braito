/**
 * Static heuristic extractor for business rules.
 * Pure function — no file I/O. Takes raw source text and returns identified
 * domain policies: numeric limits, permission guards, schema validations,
 * business constants, and conditional throws.
 */

export type BusinessRule = {
  type: 'numeric_limit' | 'permission_guard' | 'schema_validation' | 'business_constant' | 'conditional_throw'
  description: string
  location: string  // e.g. "line 42" or "function validateOrder"
  evidence: string  // the raw code snippet (1-3 lines)
}

// ---------------------------------------------------------------------------
// Heuristic patterns
// ---------------------------------------------------------------------------

// numeric_limit: MAX_*/MIN_*/LIMIT_*/THRESHOLD_* constant declarations
const NUMERIC_CONST_RE = /\b(MAX_|MIN_|LIMIT_|THRESHOLD_)\w+\s*[=:]/g

// numeric_limit: comparisons with numeric literals (e.g. > 100, >= 50, < 0)
const NUMERIC_COMPARISON_RE = /(?:>=?|<=?)\s*-?\d+(?:\.\d+)?\b/g

// permission_guard: common authorization check patterns
const PERMISSION_GUARD_RE =
  /(?:if\s*\(\s*!(?:user\.hasRole|isAdmin|isAuthenticated|can\(|hasPermission|checkPermission|requireRole)|throw\s+new\s+(?:ForbiddenException|UnauthorizedException|ForbiddenError|UnauthorizedError|AuthorizationError|AccessDeniedError|PermissionError)|checkPermission\s*\(|requireRole\s*\(|hasPermission\s*\(|isAdmin\s*\()/g

// schema_validation: Zod/Joi/Yup chain methods
const SCHEMA_VALIDATION_RE = /\.(?:min|max|regex|email|refine|matches|length|pattern|url|uuid|cuid|datetime|ip|trim|nonempty|positive|negative|nonnegative|nonpositive|int|finite|safe|multipleOf)\s*\(/g

// schema_validation: class-validator decorators
const CLASS_VALIDATOR_RE = /@(?:Min|Max|IsEmail|Length|IsUrl|IsUUID|IsInt|IsNumber|IsString|IsBoolean|IsDate|IsEnum|IsNotEmpty|MinLength|MaxLength|IsPositive|IsNegative|IsArray|ArrayMinSize|ArrayMaxSize|Matches|IsCreditCard|IsPhoneNumber|IsPostalCode)\s*\(/g

// business_constant: const declarations with ALL_CAPS names or business-domain terms
const BUSINESS_CONST_ALLCAPS_RE = /\bconst\s+([A-Z][A-Z0-9_]{2,})\s*[=:]/g
const BUSINESS_TERM_RE = /\bconst\s+\w*(?:PRICE|FEE|RATE|TAX|DISCOUNT|TIMEOUT|RETRY|TTL|EXPIR|LIMIT|QUOTA|THRESHOLD|PENALTY|SURCHARGE|COMMISSION|MARKUP|MARGIN|CAP|FLOOR|CEILING|DELAY|INTERVAL|DURATION|PERIOD|WINDOW|BURST|BACKOFF|CONCURREN)\w*\s*[=:]/gi

// conditional_throw: if (...) { throw new patterns
const CONDITIONAL_THROW_RE = /if\s*\([^)]*\)\s*\{?\s*\n?\s*throw\s+new\s+\w+/g

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLineNumber(source: string, index: number): number {
  return source.slice(0, index).split('\n').length
}

function getLineSnippet(lines: string[], lineNumber: number, context = 1): string {
  const start = Math.max(0, lineNumber - 1)
  const end = Math.min(lines.length, lineNumber + context)
  return lines.slice(start, end).map((l) => l.trim()).filter(Boolean).join(' ')
}

function dedup(rules: BusinessRule[]): BusinessRule[] {
  const seen = new Set<string>()
  return rules.filter((r) => {
    const key = `${r.type}:${r.evidence.slice(0, 60)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---------------------------------------------------------------------------
// Main extractor
// ---------------------------------------------------------------------------

export function extractBusinessRules(filePath: string, sourceText: string): BusinessRule[] {
  const lines = sourceText.split('\n')
  const rules: BusinessRule[] = []

  // ---- numeric_limit: named constants (MAX_*, MIN_*, etc.) ----
  {
    const re = new RegExp(NUMERIC_CONST_RE.source, 'g')
    let match: RegExpExecArray | null
    while ((match = re.exec(sourceText)) !== null) {
      const lineNum = getLineNumber(sourceText, match.index)
      const snippet = getLineSnippet(lines, lineNum)
      const prefix = match[1] as 'MAX_' | 'MIN_' | 'LIMIT_' | 'THRESHOLD_'
      const typeLabel = prefix === 'MAX_' || prefix === 'MIN_' ? 'upper/lower bound constant'
        : prefix === 'LIMIT_' ? 'limit constant'
        : 'threshold constant'
      rules.push({
        type: 'numeric_limit',
        description: `${typeLabel}: ${snippet.split(/\s+/).slice(1, 3).join(' ')}`,
        location: `line ${lineNum}`,
        evidence: snippet,
      })
    }
  }

  // ---- numeric_limit: comparison expressions ----
  {
    const re = new RegExp(NUMERIC_COMPARISON_RE.source, 'g')
    let match: RegExpExecArray | null
    while ((match = re.exec(sourceText)) !== null) {
      const lineNum = getLineNumber(sourceText, match.index)
      const snippet = getLineSnippet(lines, lineNum)
      // Skip if already covered by a named constant on same line
      if (/\b(?:MAX_|MIN_|LIMIT_|THRESHOLD_)\w+/.test(snippet)) continue
      rules.push({
        type: 'numeric_limit',
        description: `Numeric boundary check: ${match[0].trim()}`,
        location: `line ${lineNum}`,
        evidence: snippet,
      })
    }
  }

  // ---- permission_guard ----
  {
    const re = new RegExp(PERMISSION_GUARD_RE.source, 'g')
    let match: RegExpExecArray | null
    while ((match = re.exec(sourceText)) !== null) {
      const lineNum = getLineNumber(sourceText, match.index)
      const snippet = getLineSnippet(lines, lineNum, 2)
      const raw = match[0].trim()
      const isThrow = raw.startsWith('throw')
      rules.push({
        type: 'permission_guard',
        description: isThrow
          ? `Authorization enforcement: throws ${raw.replace('throw new ', '')}`
          : `Permission check: ${raw.slice(0, 60)}`,
        location: `line ${lineNum}`,
        evidence: snippet,
      })
    }
  }

  // ---- schema_validation: Zod/Joi/Yup methods ----
  {
    const re = new RegExp(SCHEMA_VALIDATION_RE.source, 'g')
    let match: RegExpExecArray | null
    while ((match = re.exec(sourceText)) !== null) {
      const lineNum = getLineNumber(sourceText, match.index)
      const snippet = getLineSnippet(lines, lineNum)
      rules.push({
        type: 'schema_validation',
        description: `Schema constraint: ${match[0].trim()} validation`,
        location: `line ${lineNum}`,
        evidence: snippet,
      })
    }
  }

  // ---- schema_validation: class-validator decorators ----
  {
    const re = new RegExp(CLASS_VALIDATOR_RE.source, 'g')
    let match: RegExpExecArray | null
    while ((match = re.exec(sourceText)) !== null) {
      const lineNum = getLineNumber(sourceText, match.index)
      const snippet = getLineSnippet(lines, lineNum)
      rules.push({
        type: 'schema_validation',
        description: `Class-validator decorator: ${match[0].replace('(', '').trim()}`,
        location: `line ${lineNum}`,
        evidence: snippet,
      })
    }
  }

  // ---- business_constant: ALL_CAPS ----
  {
    const re = new RegExp(BUSINESS_CONST_ALLCAPS_RE.source, 'g')
    let match: RegExpExecArray | null
    while ((match = re.exec(sourceText)) !== null) {
      const name = match[1]
      // Skip if already covered by numeric_limit prefix
      if (/^(?:MAX_|MIN_|LIMIT_|THRESHOLD_)/.test(name)) continue
      const lineNum = getLineNumber(sourceText, match.index)
      const snippet = getLineSnippet(lines, lineNum)
      rules.push({
        type: 'business_constant',
        description: `Business constant: ${name}`,
        location: `line ${lineNum}`,
        evidence: snippet,
      })
    }
  }

  // ---- business_constant: domain-term names ----
  {
    const re = new RegExp(BUSINESS_TERM_RE.source, 'gi')
    let match: RegExpExecArray | null
    while ((match = re.exec(sourceText)) !== null) {
      const lineNum = getLineNumber(sourceText, match.index)
      const snippet = getLineSnippet(lines, lineNum)
      // Avoid double-reporting what ALL_CAPS already caught
      const varName = (match[0].match(/const\s+(\w+)/) ?? [])[1] ?? ''
      if (/^[A-Z][A-Z0-9_]{2,}$/.test(varName)) continue
      rules.push({
        type: 'business_constant',
        description: `Domain constant: ${varName || snippet.slice(0, 40)}`,
        location: `line ${lineNum}`,
        evidence: snippet,
      })
    }
  }

  // ---- conditional_throw ----
  {
    const re = new RegExp(CONDITIONAL_THROW_RE.source, 'g')
    let match: RegExpExecArray | null
    while ((match = re.exec(sourceText)) !== null) {
      // Skip if already captured as a permission guard
      if (PERMISSION_GUARD_RE.test(match[0])) {
        PERMISSION_GUARD_RE.lastIndex = 0
        continue
      }
      PERMISSION_GUARD_RE.lastIndex = 0
      const lineNum = getLineNumber(sourceText, match.index)
      const snippet = getLineSnippet(lines, lineNum, 2)
      rules.push({
        type: 'conditional_throw',
        description: `Domain invariant enforcement: conditional throw`,
        location: `line ${lineNum}`,
        evidence: snippet,
      })
    }
  }

  return dedup(rules)
}
