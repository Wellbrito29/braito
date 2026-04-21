import { z } from 'zod'

export const CreateUserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
})

export type CreateUserDto = z.infer<typeof CreateUserSchema>
