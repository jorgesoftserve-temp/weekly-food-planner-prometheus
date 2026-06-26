import { z } from 'zod'
import { formatZodError } from './validation'

export { formatZodError }

export const createRecipeBodySchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  notes: z.string().trim().nullable().optional(),
  ingredients: z.array(z.string().trim().min(1)).optional(),
})

export const updateRecipeBodySchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    notes: z.string().trim().nullable().optional(),
    ingredients: z.array(z.string().trim().min(1)).optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'at least one field is required',
  })

export const setRecipeTagsBodySchema = z.object({
  tagIds: z.array(z.string().uuid()),
})

export type CreateRecipeBody = z.infer<typeof createRecipeBodySchema>
export type UpdateRecipeBody = z.infer<typeof updateRecipeBodySchema>
export type SetRecipeTagsBody = z.infer<typeof setRecipeTagsBodySchema>
