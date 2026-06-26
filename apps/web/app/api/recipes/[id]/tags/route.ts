import { getRecipe, setRecipeTags } from '@recipe-box/supabase'
import { getAuthenticatedUser } from '@/lib/api/auth-helpers'
import {
  formatZodError,
  setRecipeTagsBodySchema,
} from '@/lib/api/recipes'
import {
  badRequest,
  jsonOk,
  notFound,
  unauthorized,
} from '@/lib/api/responses'
import { runWithErrorHandler } from '@/lib/api/route-helpers'

type RouteParams = { id: string }

export const POST = async (
  request: Request,
  { params }: { params: Promise<RouteParams> },
) => {
  const { id: recipeId } = await params
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  const raw = await request.json().catch(() => null)
  const parsed = setRecipeTagsBodySchema.safeParse(raw)
  if (!parsed.success) return badRequest(formatZodError(parsed.error))

  return runWithErrorHandler(async () => {
    const recipe = await getRecipe({
      supabase: user.supabase,
      ownerId: user.id,
      recipeId,
    })
    if (!recipe) return notFound()

    await setRecipeTags({
      supabase: user.supabase,
      ownerId: user.id,
      recipeId,
      tagIds: parsed.data.tagIds,
    })
    return jsonOk({ data: { ok: true } })
  })
}
