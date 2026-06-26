import {
  listPlanEntriesForWeek,
  upsertPlanEntry,
} from '@recipe-box/supabase'
import { getAuthenticatedUser } from '@/lib/api/auth-helpers'
import {
  formatZodError,
  upsertPlanEntryBodySchema,
  weekStartQuerySchema,
} from '@/lib/api/plan'
import { badRequest, jsonOk, unauthorized } from '@/lib/api/responses'
import { runWithErrorHandler } from '@/lib/api/route-helpers'

export const GET = async (request: Request) => {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  const url = new URL(request.url)
  const parsed = weekStartQuerySchema.safeParse({
    weekStart: url.searchParams.get('weekStart'),
  })
  if (!parsed.success) return badRequest(formatZodError(parsed.error))

  return runWithErrorHandler(async () => {
    const entries = await listPlanEntriesForWeek({
      supabase: user.supabase,
      ownerId: user.id,
      weekStart: parsed.data.weekStart,
    })
    return jsonOk({ data: entries })
  })
}

export const POST = async (request: Request) => {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  const raw = await request.json().catch(() => null)
  const parsed = upsertPlanEntryBodySchema.safeParse(raw)
  if (!parsed.success) return badRequest(formatZodError(parsed.error))

  return runWithErrorHandler(async () => {
    const result = await upsertPlanEntry({
      supabase: user.supabase,
      ownerId: user.id,
      payload: parsed.data,
    })
    return jsonOk({ data: result }, { status: result.created ? 201 : 200 })
  })
}
