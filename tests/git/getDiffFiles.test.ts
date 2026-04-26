import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { getDiffFiles } from '../../src/core/git/getDiffFiles.ts'

let scratch: string

async function git(cwd: string, ...args: string[]): Promise<void> {
  const r = Bun.spawnSync(['git', ...args], { cwd })
  if (r.exitCode !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${r.stderr.toString()}`)
  }
}

beforeAll(async () => {
  scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'braito-difftest-'))

  // Init repo with a deterministic identity so commits work in CI sandboxes
  // that don't have a global git config.
  await git(scratch, 'init', '-q', '-b', 'main')
  await git(scratch, 'config', 'user.email', 'test@braito.local')
  await git(scratch, 'config', 'user.name', 'Braito Test')
  await git(scratch, 'config', 'commit.gpgsign', 'false')

  await fs.writeFile(path.join(scratch, 'keep.ts'), '// untouched\n')
  await fs.writeFile(path.join(scratch, 'edit.ts'), '// v1\n')
  await fs.writeFile(path.join(scratch, 'gone.ts'), '// will be deleted\n')
  await git(scratch, 'add', '.')
  await git(scratch, 'commit', '-q', '-m', 'base')

  // Branch with a mix: add + modify + delete
  await git(scratch, 'checkout', '-q', '-b', 'feature')
  await fs.writeFile(path.join(scratch, 'new.ts'), '// brand new\n')
  await fs.writeFile(path.join(scratch, 'edit.ts'), '// v2 — edited\n')
  await fs.unlink(path.join(scratch, 'gone.ts'))
  await git(scratch, 'add', '-A')
  await git(scratch, 'commit', '-q', '-m', 'feature change')
})

afterAll(async () => {
  await fs.rm(scratch, { recursive: true, force: true })
})

describe('getDiffFiles', () => {
  it('classifies added/modified/deleted against the base ref', () => {
    const r = getDiffFiles('main', scratch)
    expect(r.added.has('new.ts')).toBe(true)
    expect(r.modified.has('edit.ts')).toBe(true)
    expect(r.deleted.has('gone.ts')).toBe(true)

    expect(r.added.has('edit.ts')).toBe(false)
    expect(r.modified.has('new.ts')).toBe(false)
    expect(r.added.has('keep.ts')).toBe(false)
  })

  it('returns empty sets when ref does not exist', () => {
    const r = getDiffFiles('does-not-exist', scratch)
    expect(r.added.size).toBe(0)
    expect(r.modified.size).toBe(0)
    expect(r.deleted.size).toBe(0)
  })

  it('returns empty sets outside a git repo', async () => {
    const tmpNonRepo = await fs.mkdtemp(path.join(os.tmpdir(), 'braito-nongit-'))
    try {
      const r = getDiffFiles('main', tmpNonRepo)
      expect(r.added.size).toBe(0)
      expect(r.modified.size).toBe(0)
      expect(r.deleted.size).toBe(0)
    } finally {
      await fs.rm(tmpNonRepo, { recursive: true, force: true })
    }
  })
})
