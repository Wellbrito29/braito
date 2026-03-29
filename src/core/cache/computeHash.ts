export async function computeHash(filePath: string): Promise<string> {
  const buffer = await Bun.file(filePath).arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
