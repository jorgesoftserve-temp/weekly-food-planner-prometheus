import type { SupabaseClient } from '@supabase/supabase-js'
import type { MealSlot } from '../types/db.js'

export type PlanEntryRecord = {
  id: string
  recipe_id: string
  week_start: string
  day_of_week: number
  slot: MealSlot
}

export type UpsertPlanEntryPayload = {
  recipe_id: string
  week_start: string
  day_of_week: number
  slot: MealSlot
}

export const planEntryKeys = {
  week: (ownerId: string, weekStart: string) =>
    ['plan_entries', 'week', ownerId, weekStart] as const,
  detail: (ownerId: string, entryId: string) =>
    ['plan_entries', 'detail', ownerId, entryId] as const,
}

const PLAN_ENTRY_SELECT = 'id, recipe_id, week_start, day_of_week, slot'

export const listPlanEntriesForWeek = async ({
  supabase,
  ownerId,
  weekStart,
}: {
  supabase: SupabaseClient
  ownerId: string
  weekStart: string
}): Promise<PlanEntryRecord[]> => {
  const { data, error } = await supabase
    .from('plan_entries')
    .select(PLAN_ENTRY_SELECT)
    .eq('owner_id', ownerId)
    .eq('week_start', weekStart)
    .eq('is_deleted', false)
    .order('day_of_week', { ascending: true })
    .order('slot', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PlanEntryRecord[]
}

export const getPlanEntry = async ({
  supabase,
  ownerId,
  entryId,
}: {
  supabase: SupabaseClient
  ownerId: string
  entryId: string
}): Promise<PlanEntryRecord | null> => {
  const { data, error } = await supabase
    .from('plan_entries')
    .select(PLAN_ENTRY_SELECT)
    .eq('id', entryId)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as PlanEntryRecord | null) ?? null
}

export const upsertPlanEntry = async ({
  supabase,
  ownerId,
  payload,
}: {
  supabase: SupabaseClient
  ownerId: string
  payload: UpsertPlanEntryPayload
}): Promise<{ id: string; created: boolean }> => {
  const { data: existing, error: lookupError } = await supabase
    .from('plan_entries')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('week_start', payload.week_start)
    .eq('day_of_week', payload.day_of_week)
    .eq('slot', payload.slot)
    .eq('is_deleted', false)
    .maybeSingle()
  if (lookupError) throw new Error(lookupError.message)

  if (existing) {
    const { error: updateError } = await supabase
      .from('plan_entries')
      .update({ recipe_id: payload.recipe_id })
      .eq('id', existing.id)
      .eq('owner_id', ownerId)
    if (updateError) throw new Error(updateError.message)
    return { id: (existing as { id: string }).id, created: false }
  }

  const { data: row, error: insertError } = await supabase
    .from('plan_entries')
    .insert({
      owner_id: ownerId,
      recipe_id: payload.recipe_id,
      week_start: payload.week_start,
      day_of_week: payload.day_of_week,
      slot: payload.slot,
    })
    .select('id')
    .single()
  if (insertError || !row) {
    throw new Error(insertError?.message ?? 'failed to create plan entry')
  }
  return { id: (row as { id: string }).id, created: true }
}

export const softDeletePlanEntry = async ({
  supabase,
  ownerId,
  entryId,
}: {
  supabase: SupabaseClient
  ownerId: string
  entryId: string
}): Promise<void> => {
  const { error } = await supabase
    .from('plan_entries')
    .update({ is_deleted: true })
    .eq('id', entryId)
    .eq('owner_id', ownerId)
    .eq('is_deleted', false)
  if (error) throw new Error(error.message)
}
