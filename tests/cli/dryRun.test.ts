import { describe, it, expect, afterEach } from 'bun:test'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { runGenerate } from '../../src/cli/commands/generate.ts'

async function makeTmpDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'braito-dryrun-'))
  return dir
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

describe('generate --dry-run', () => {
  const tmpDirs: string[] = []

  afterEach(async () => {
    for (const dir of tmpDirs) {
      await fs.rm(dir, { recursive: true, force: true })
    }
    tmpDirs.length = 0
  })

  it('does not create .ai-notes/ directory', async () => {
    const tmpDir = await makeTmpDir()
    tmpDirs.push(tmpDir)

    // Create a simple TypeScript source file
    await fs.writeFile(
      path.join(tmpDir, 'index.ts'),
      'export function hello(name: string): string { return `Hello, ${name}!` }\n',
    )

    await runGenerate({ root: tmpDir, dryRun: true })

    const aiNotesDir = path.join(tmpDir, '.ai-notes')
    expect(await exists(aiNotesDir)).toBe(false)
  })

  it('does not create cache/hashes.json', async () => {
    const tmpDir = await makeTmpDir()
    tmpDirs.push(tmpDir)

    await fs.writeFile(
      path.join(tmpDir, 'utils.ts'),
      'export const add = (a: number, b: number) => a + b\n',
    )

    await runGenerate({ root: tmpDir, dryRun: true })

    const cacheFile = path.join(tmpDir, 'cache', 'hashes.json')
    expect(await exists(cacheFile)).toBe(false)
  })

  it('completes without error', async () => {
    const tmpDir = await makeTmpDir()
    tmpDirs.push(tmpDir)

    await fs.writeFile(
      path.join(tmpDir, 'app.ts'),
      'import fs from "node:fs"\nexport const readConfig = () => fs.readFileSync("config.json", "utf-8")\n',
    )

    // Should resolve without throwing
    await expect(runGenerate({ root: tmpDir, dryRun: true })).resolves.toBeUndefined()
  })

  it('does not write any files at all when dry-run is true', async () => {
    const tmpDir = await makeTmpDir()
    tmpDirs.push(tmpDir)

    await fs.writeFile(
      path.join(tmpDir, 'service.ts'),
      'export class UserService { getUser(id: string) { return { id } } }\n',
    )

    await runGenerate({ root: tmpDir, dryRun: true })

    // The only thing that should exist in tmpDir is the source file we created
    const entries = await fs.readdir(tmpDir)
    expect(entries).toEqual(['service.ts'])
  })
})
