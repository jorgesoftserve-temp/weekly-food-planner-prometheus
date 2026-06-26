import type { SupabaseClient } from '@supabase/supabase-js'

export type RecipeRecord = {
  id: string
  title: string
  notes: string | null
  ingredients: string[]
}

export type CreateRecipePayload = {
  title: string
  notes?: string | null
  ingredients?: string[]
}

export type UpdateRecipePatch = Partial<{
  title: string
  notes: string | null
  ingredients: string[]
}>

export const recipeKeys = {
  list: (ownerId: string) => ['recipes', 'list', ownerId] as const,
  detail: (ownerId: string, recipeId: string) =>
    ['recipes', 'detail', ownerId, recipeId] as const,
}

const RECIPE_SELECT = 'id, title, notes, ingredients'

export const listRecipes = async ({
  supabase,
  ownerId,
}: {
  supabase: SupabaseClient
  ownerId: string
}): Promise<RecipeRecord[]> => {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as RecipeRecord[]
}

export const getRecipe = async ({
  supabase,
  ownerId,
  recipeId,
}: {
  supabase: SupabaseClient
  ownerId: string
  recipeId: string
}): Promise<RecipeRecord | null> => {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .eq('id', recipeId)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as RecipeRecord | null) ?? null
}

export const createRecipe = async ({
  supabase,
  ownerId,
  payload,
}: {
  supabase: SupabaseClient
  ownerId: string
  payload: CreateRecipePayload
}): Promise<{ id: string }> => {
  const { data: row, error } = await supabase
    .from('recipes')
    .insert({
      owner_id: ownerId,
      title: payload.title,
      notes: payload.notes ?? null,
      ingredients: payload.ingredients ?? [],
    })
    .select('id')
    .single()
  if (error || !row) {
    throw new Error(error?.message ?? 'failed to create recipe')
  }
  return { id: (row as { id: string }).id }
}

export const updateRecipe = async ({
  supabase,
  ownerId,
  recipeId,
  patch,
}: {
  supabase: SupabaseClient
  ownerId: string
  recipeId: string
  patch: UpdateRecipePatch
}): Promise<void> => {
  if (Object.keys(patch).length === 0) throw new Error('no fields to update')
  const { error } = await supabase
    .from('recipes')
    .update(patch)
    .eq('id', recipeId)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
  if (error) throw new Error(error.message)
}

export const softDeleteRecipe = async ({
  supabase,
  ownerId,
  recipeId,
}: {
  supabase: SupabaseClient
  ownerId: string
  recipeId: string
}): Promise<void> => {
  const { error } = await supabase
    .from('recipes')
    .update({ is_deleted: true })
    .eq('id', recipeId)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
  if (error) throw new Error(error.message)
}
