import type { SupabaseClient } from '@supabase/supabase-js'

export type TagRecord = {
  id: string
  label: string
  color: string | null
}

export type CreateTagPayload = {
  label: string
  color?: string | null
}

export type UpdateTagPatch = Partial<{
  label: string
  color: string | null
}>

export const tagKeys = {
  list: (ownerId: string) => ['tags', 'list', ownerId] as const,
  detail: (ownerId: string, tagId: string) =>
    ['tags', 'detail', ownerId, tagId] as const,
}

const TAG_SELECT = 'id, label, color'

export const listTags = async ({
  supabase,
  ownerId,
}: {
  supabase: SupabaseClient
  ownerId: string
}): Promise<TagRecord[]> => {
  const { data, error } = await supabase
    .from('tags')
    .select(TAG_SELECT)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as TagRecord[]
}

export const getTag = async ({
  supabase,
  ownerId,
  tagId,
}: {
  supabase: SupabaseClient
  ownerId: string
  tagId: string
}): Promise<TagRecord | null> => {
  const { data, error } = await supabase
    .from('tags')
    .select(TAG_SELECT)
    .eq('id', tagId)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as TagRecord | null) ?? null
}

export const createTag = async ({
  supabase,
  ownerId,
  payload,
}: {
  supabase: SupabaseClient
  ownerId: string
  payload: CreateTagPayload
}): Promise<{ id: string }> => {
  const { data: row, error } = await supabase
    .from('tags')
    .insert({
      owner_id: ownerId,
      label: payload.label,
      color: payload.color ?? null,
    })
    .select('id')
    .single()
  if (error || !row) {
    throw new Error(error?.message ?? 'failed to create tag')
  }
  return { id: (row as { id: string }).id }
}

export const updateTag = async ({
  supabase,
  ownerId,
  tagId,
  patch,
}: {
  supabase: SupabaseClient
  ownerId: string
  tagId: string
  patch: UpdateTagPatch
}): Promise<void> => {
  if (Object.keys(patch).length === 0) throw new Error('no fields to update')
  const { error } = await supabase
    .from('tags')
    .update(patch)
    .eq('id', tagId)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
  if (error) throw new Error(error.message)
}

export const softDeleteTag = async ({
  supabase,
  ownerId,
  tagId,
}: {
  supabase: SupabaseClient
  ownerId: string
  tagId: string
}): Promise<void> => {
  const { error } = await supabase
    .from('tags')
    .update({ is_deleted: true })
    .eq('id', tagId)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
  if (error) throw new Error(error.message)
}
