import type { CreateUserDto } from '../domain/user.dto'
import { UserService } from '../domain/user.service'

/**
 * HTTP endpoints for user management.
 */
export class UserController {
  constructor(private readonly service: UserService) {}

  async create(body: CreateUserDto): Promise<{ id: string }> {
    const user = await this.service.createUser(body)
    return { id: user.id }
  }

  async findById(id: string): Promise<{ id: string; email: string } | null> {
    return this.service.findUser(id)
  }
}
