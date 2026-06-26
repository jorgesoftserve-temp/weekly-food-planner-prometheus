import {
  getRecipe,
  softDeleteRecipe,
  updateRecipe,
} from '@recipe-box/supabase'
import { getAuthenticatedUser } from '@/lib/api/auth-helpers'
import {
  formatZodError,
  updateRecipeBodySchema,
} from '@/lib/api/recipes'
import {
  badRequest,
  jsonOk,
  notFound,
  unauthorized,
} from '@/lib/api/responses'
import { runWithErrorHandler } from '@/lib/api/route-helpers'

type RouteParams = { id: string }

export const GET = async (
  _request: Request,
  { params }: { params: Promise<RouteParams> },
) => {
  const { id: recipeId } = await params
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  return runWithErrorHandler(async () => {
    const recipe = await getRecipe({
      supabase: user.supabase,
      ownerId: user.id,
      recipeId,
    })
    if (!recipe) return notFound()
    return jsonOk({ data: recipe })
  })
}

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<RouteParams> },
) => {
  const { id: recipeId } = await params
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  const raw = await request.json().catch(() => null)
  const parsed = updateRecipeBodySchema.safeParse(raw)
  if (!parsed.success) return badRequest(formatZodError(parsed.error))

  return runWithErrorHandler(async () => {
    const existing = await getRecipe({
      supabase: user.supabase,
      ownerId: user.id,
      recipeId,
    })
    if (!existing) return notFound()

    await updateRecipe({
      supabase: user.supabase,
      ownerId: user.id,
      recipeId,
      patch: parsed.data,
    })
    const recipe = await getRecipe({
      supabase: user.supabase,
      ownerId: user.id,
      recipeId,
    })
    return jsonOk({ data: recipe })
  })
}

export const DELETE = async (
  _request: Request,
  { params }: { params: Promise<RouteParams> },
) => {
  const { id: recipeId } = await params
  const user = await getAuthenticatedUser()
  if (!user) return unauthorized()

  return runWithErrorHandler(async () => {
    const existing = await getRecipe({
      supabase: user.supabase,
      ownerId: user.id,
      recipeId,
    })
    if (!existing) return notFound()

    await softDeleteRecipe({
      supabase: user.supabase,
      ownerId: user.id,
      recipeId,
    })
    return jsonOk({ data: { ok: true } })
  })
}
