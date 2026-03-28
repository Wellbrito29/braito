import path from 'node:path'
import type { DiscoveredFile } from '../types/project.ts'
import { shouldIgnore } from './ignoreRules.ts'

export async function discoverFiles(
  root: string,
  include: string[],
  exclude: string[],
): Promise<DiscoveredFile[]> {
  const results: DiscoveredFile[] = []
  const seen = new Set<string>()

  for (const pattern of include) {
    const glob = new Bun.Glob(pattern)

    for await (const relativePath of glob.scan({ cwd: root, dot: false })) {
      if (seen.has(relativePath)) continue
      if (shouldIgnore(relativePath, exclude)) continue

      const absolutePath = path.resolve(root, relativePath)
      const stat = await Bun.file(absolutePath).exists()
        ? { size: (await Bun.file(absolutePath).arrayBuffer()).byteLength }
        : { size: 0 }

      seen.add(relativePath)
      results.push({
        path: absolutePath,
        relativePath,
        extension: path.extname(relativePath),
        size: stat.size,
      })
    }
  }

  return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}
