import type { SupabaseClient } from '@supabase/supabase-js'
import type { TagRecord } from './tags.js'

export type RecipeTagRecord = {
  recipe_id: string
  tag_id: string
}

export const recipeTagQueryKeys = {
  forRecipe: (ownerId: string, recipeId: string) =>
    ['recipe_tags', 'for_recipe', ownerId, recipeId] as const,
}

export const recipeTagKeys = {
  forRecipe: (ownerId: string, recipeId: string) =>
    ['recipe_tags', 'for_recipe', ownerId, recipeId] as const,
}

const RECIPE_TAG_SELECT = 'recipe_id, tag_id'

export const listRecipeTags = async ({
  supabase,
  recipeId,
}: {
  supabase: SupabaseClient
  recipeId: string
}): Promise<RecipeTagRecord[]> => {
  const { data, error } = await supabase
    .from('recipe_tags')
    .select(RECIPE_TAG_SELECT)
    .eq('recipe_id', recipeId)
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as RecipeTagRecord[]
}

export const listTagsForRecipe = async ({
  supabase,
  recipeId,
}: {
  supabase: SupabaseClient
  recipeId: string
}): Promise<TagRecord[]> => {
  const { data: links, error: linkError } = await supabase
    .from('recipe_tags')
    .select('tag_id')
    .eq('recipe_id', recipeId)
  if (linkError) throw new Error(linkError.message)
  const tagIds = (links ?? []).map((r) => (r as { tag_id: string }).tag_id)
  if (tagIds.length === 0) return []
  // Explicit is_deleted filter: the SELECT policy no longer filters soft-deleted
  // rows (see migration 20260624180000), so we must enforce it at the app layer.
  const { data, error } = await supabase
    .from('tags')
    .select('id, label, color')
    .in('id', tagIds)
    .eq('is_deleted', false)
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as TagRecord[]
}

export const setRecipeTags = async ({
  supabase,
  ownerId,
  recipeId,
  tagIds,
}: {
  supabase: SupabaseClient
  ownerId: string
  recipeId: string
  tagIds: string[]
}): Promise<void> => {
  if (tagIds.length > 0) {
    const { data: valid, error: checkErr } = await supabase
      .from('tags')
      .select('id')
      .in('id', tagIds)
      .eq('owner_id', ownerId)
      .eq('is_deleted', false)
    if (checkErr) throw new Error(checkErr.message)
    const validSet = new Set((valid ?? []).map((r) => (r as { id: string }).id))
    const bad = tagIds.find((id) => !validSet.has(id))
    if (bad) throw new Error(`tag not found or not accessible: ${bad}`)
  }

  const { error: deleteError } = await supabase
    .from('recipe_tags')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('owner_id', ownerId)
  if (deleteError) throw new Error(deleteError.message)

  if (tagIds.length === 0) return

  const rows = tagIds.map((tagId) => ({
    recipe_id: recipeId,
    tag_id: tagId,
    owner_id: ownerId,
  }))
  const { error: insertError } = await supabase.from('recipe_tags').insert(rows)
  if (insertError) throw new Error(insertError.message)
}
