import { z } from 'zod'
import { formatZodError } from './validation'

export { formatZodError }

export const createTagBodySchema = z.object({
  label: z.string().trim().min(1, 'label is required'),
  color: z.string().trim().nullable().optional(),
})

export type CreateTagBody = z.infer<typeof createTagBodySchema>
