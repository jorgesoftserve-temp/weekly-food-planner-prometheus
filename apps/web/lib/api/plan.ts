import { z } from 'zod'
import { formatZodError } from './validation'

export { formatZodError }

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'] as const

const isMonday = (s: string) => new Date(s + 'T00:00:00Z').getUTCDay() === 1

export const weekStartQuerySchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStart must be YYYY-MM-DD')
    .refine(isMonday, 'weekStart must be a Monday'),
})

export const upsertPlanEntryBodySchema = z.object({
  recipe_id: z.string().uuid(),
  week_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'week_start must be YYYY-MM-DD')
    .refine(isMonday, 'week_start must be a Monday'),
  day_of_week: z.number().int().min(0).max(6),
  slot: z.enum(MEAL_SLOTS).default('dinner'),
})

export type UpsertPlanEntryBody = z.infer<typeof upsertPlanEntryBodySchema>
