import { randomUUID } from 'node:crypto'

export class User {
  id: string
  email: string

  constructor(email: string, id?: string) {
    this.email = email
    this.id = id ?? randomUUID()
  }
}
