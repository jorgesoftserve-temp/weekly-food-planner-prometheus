import { createTag, listTags } from '@recipe-box/supabase'
import { getAuthenticatedUser } from '@/lib/api/auth-helpers'
import { badRequest, jsonOk, unauthorized } from '@/lib/api/responses'
import { runWithErrorHandler } from '@/lib/api/route-helpers'
import { createTagBodySchema, formatZodError } from '@/lib/api/tags'

export const GET = async () => {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  return runWithErrorHandler(async () => {
    const tags = await listTags({
      supabase: user.supabase,
      ownerId: user.id,
    })
    return jsonOk({ data: tags })
  })
}

export const POST = async (request: Request) => {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  const raw = await request.json().catch(() => null)
  const parsed = createTagBodySchema.safeParse(raw)
  if (!parsed.success) return badRequest(formatZodError(parsed.error))

  return runWithErrorHandler(async () => {
    const created = await createTag({
      supabase: user.supabase,
      ownerId: user.id,
      payload: parsed.data,
    })
    return jsonOk({ data: created }, { status: 201 })
  })
}
