import { getPlanEntry, softDeletePlanEntry } from '@recipe-box/supabase'
import { getAuthenticatedUser } from '@/lib/api/auth-helpers'
import { jsonOk, notFound, unauthorized } from '@/lib/api/responses'
import { runWithErrorHandler } from '@/lib/api/route-helpers'

type RouteParams = { id: string }

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<RouteParams> },
) => {
  const { id: entryId } = await params
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  return runWithErrorHandler(async () => {
    const existing = await getPlanEntry({
      supabase: user.supabase,
      ownerId: user.id,
      entryId,
    })
    if (!existing) return notFound()

    await softDeletePlanEntry({
      supabase: user.supabase,
      ownerId: user.id,
      entryId,
    })
    return jsonOk({ data: { ok: true } })
  })
}
