import axios from 'axios'
import mongoose from 'mongoose'
import type { CreateUserDto } from './user.dto'
import { User } from './user.entity'

export class UserService {
  private connection: mongoose.Connection

  constructor() {
    this.connection = mongoose.connection
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = new User(dto.email)
    await this.connection.collection('users').insertOne({ id: user.id, email: user.email })
    return user
  }

  async findUser(id: string): Promise<User | null> {
    const doc = await this.connection.collection('users').findOne({ id })
    if (!doc) return null
    return new User(doc.email as string, doc.id as string)
  }

  async syncFromExternal(id: string): Promise<void> {
    const resp = await axios.get(`https://api.example.com/users/${id}`)
    await this.connection.collection('users').updateOne({ id }, { $set: resp.data })
  }
}
