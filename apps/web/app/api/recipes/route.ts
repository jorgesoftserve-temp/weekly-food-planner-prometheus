import {
  createRecipe,
  listRecipes,
} from '@recipe-box/supabase'
import { getAuthenticatedUser } from '@/lib/api/auth-helpers'
import {
  createRecipeBodySchema,
  formatZodError,
} from '@/lib/api/recipes'
import { badRequest, jsonOk, unauthorized } from '@/lib/api/responses'
import { runWithErrorHandler } from '@/lib/api/route-helpers'

export const GET = async () => {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  return runWithErrorHandler(async () => {
    const recipes = await listRecipes({
      supabase: user.supabase,
      ownerId: user.id,
    })
    return jsonOk({ data: recipes })
  })
}

export const POST = async (request: Request) => {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  const raw = await request.json().catch(() => null)
  const parsed = createRecipeBodySchema.safeParse(raw)
  if (!parsed.success) return badRequest(formatZodError(parsed.error))

  return runWithErrorHandler(async () => {
    const created = await createRecipe({
      supabase: user.supabase,
      ownerId: user.id,
      payload: parsed.data,
    })
    return jsonOk({ data: created }, { status: 201 })
  })
}
