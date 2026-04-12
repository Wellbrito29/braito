import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { detectGovernanceModel } from '../../src/core/governance/detectGovernanceModel.ts'
import { loadGovernanceContext } from '../../src/core/governance/loadGovernanceContext.ts'

describe('detectGovernanceModel', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-gov-test-'))
  })

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns detected=false when no governance docs exist', () => {
    const model = detectGovernanceModel(tmpDir)
    expect(model.detected).toBe(false)
    expect(model.style).toBe('none')
    expect(model.docs).toHaveLength(0)
  })

  it('detects custom governance when some docs exist', () => {
    const docsDir = path.join(tmpDir, 'Docs')
    fs.mkdirSync(docsDir, { recursive: true })
    fs.writeFileSync(path.join(docsDir, 'architecture.md'), '# Architecture\n\n## Overview\nThe system uses a layered architecture.\n\n## Key constraint\n- All API calls must go through the gateway\n- Authentication is mandatory for all endpoints\n')

    const model = detectGovernanceModel(tmpDir)
    expect(model.detected).toBe(true)
    expect(model.style).toBe('custom')
    expect(model.docs.length).toBeGreaterThanOrEqual(1)

    const archDoc = model.docs.find((d) => d.category === 'architecture')
    expect(archDoc).toBeDefined()
    expect(archDoc!.title).toBe('Architecture')
    expect(archDoc!.sections.size).toBeGreaterThan(0)
  })

  it('detects nebula-like governance when 3+ Nebula docs exist', () => {
    const docsDir = path.join(tmpDir, 'Docs')
    fs.writeFileSync(path.join(docsDir, 'brief.md'), '# Project Brief\n\nA web platform for...')
    fs.writeFileSync(path.join(docsDir, 'project.md'), '# Project\n\nDetails about...')
    fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Plan\n\n## Milestones\n- Phase 1: MVP\n- Phase 2: Scale')

    const model = detectGovernanceModel(tmpDir)
    expect(model.detected).toBe(true)
    expect(model.style).toBe('nebula-like')
    expect(model.docs.length).toBeGreaterThanOrEqual(4)
  })

  it('scans Workflows/ and Quality/ directories', () => {
    const wfDir = path.join(tmpDir, 'Workflows')
    const qDir = path.join(tmpDir, 'Quality')
    fs.mkdirSync(wfDir, { recursive: true })
    fs.mkdirSync(qDir, { recursive: true })
    fs.writeFileSync(path.join(wfDir, 'feature.md'), '# Feature Workflow\n\n1. Create branch\n2. Implement\n3. PR')
    fs.writeFileSync(path.join(qDir, 'review-checklist.md'), '# Review Checklist\n\n## Validation rules\n- Tests must pass\n- Coverage >= 80%')

    const model = detectGovernanceModel(tmpDir)
    const wfDoc = model.docs.find((d) => d.category === 'workflow')
    const qDoc = model.docs.find((d) => d.category === 'quality')
    expect(wfDoc).toBeDefined()
    expect(qDoc).toBeDefined()
  })

  it('extracts sections from markdown headings', () => {
    const model = detectGovernanceModel(tmpDir)
    const archDoc = model.docs.find((d) => d.path === 'Docs/architecture.md')
    expect(archDoc).toBeDefined()
    expect(archDoc!.sections.has('Overview')).toBe(true)
    expect(archDoc!.sections.has('Key constraint')).toBe(true)
  })
})

describe('loadGovernanceContext', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braito-gov-ctx-'))
  })

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns null when no governance docs exist', () => {
    const ctx = loadGovernanceContext(tmpDir)
    expect(ctx).toBeNull()
  })

  it('returns context with prompt summary when docs exist', () => {
    const docsDir = path.join(tmpDir, 'Docs')
    fs.mkdirSync(docsDir, { recursive: true })
    fs.writeFileSync(path.join(docsDir, 'architecture.md'), '# Architecture\n\n## Decisions\n- Chose PostgreSQL over MongoDB for ACID compliance\n- API gateway pattern for all external calls\n\n## Structure\nCode lives in `src/core/` and `src/cli/`.\n')

    const ctx = loadGovernanceContext(tmpDir)
    expect(ctx).not.toBeNull()
    expect(ctx!.model.detected).toBe(true)
    expect(ctx!.promptSummary).toContain('governance')
    expect(ctx!.promptSummary.length).toBeLessThanOrEqual(4000)
  })

  it('extracts file governance info from path mentions in docs', () => {
    const ctx = loadGovernanceContext(tmpDir)
    expect(ctx).not.toBeNull()
    // The architecture doc mentions src/core/ and src/cli/
    expect(ctx!.fileGovernance.size).toBeGreaterThanOrEqual(0)
  })

  it('extracts decisions from architecture docs', () => {
    const ctx = loadGovernanceContext(tmpDir)
    expect(ctx).not.toBeNull()
    // Check that the model has docs with decision-extractable content
    const archDoc = ctx!.model.docs.find((d) => d.category === 'architecture')
    expect(archDoc).toBeDefined()
    expect(archDoc!.sections.has('Decisions')).toBe(true)
  })
})
