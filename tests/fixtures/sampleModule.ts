import path from 'node:path'
import { readFileSync } from 'node:fs'
import { parseConfig } from '../config/parseConfig'

export const VERSION = '1.0.0'

export function loadFile(filePath: string): string {
  return readFileSync(path.resolve(filePath), 'utf-8')
}

export class FileLoader {
  constructor(private root: string) {}

  load(name: string): string {
    return loadFile(path.join(this.root, name))
  }
}
