export type DiscoveredFile = {
  path: string
  relativePath: string
  extension: string
  size: number
}

export type AiNotesConfig = {
  root: string
  include: string[]
  exclude: string[]
  output: string
  tsconfigPath?: string
}
