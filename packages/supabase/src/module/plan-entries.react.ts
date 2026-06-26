import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getPlanEntry,
  listPlanEntriesForWeek,
  planEntryKeys,
  softDeletePlanEntry,
  upsertPlanEntry,
  type PlanEntryRecord,
  type UpsertPlanEntryPayload,
} from './plan-entries.js'

export const usePlanEntriesForWeek = ({
  supabase,
  ownerId,
  weekStart,
  enabled = true,
}: {
  supabase: SupabaseClient
  ownerId: string | null
  weekStart: string | null
  enabled?: boolean
}): UseQueryResult<PlanEntryRecord[]> =>
  useQuery({
    queryKey: planEntryKeys.week(ownerId ?? '', weekStart ?? ''),
    queryFn: () =>
      listPlanEntriesForWeek({
        supabase,
        ownerId: ownerId!,
        weekStart: weekStart!,
      }),
    enabled: enabled && !!ownerId && !!weekStart,
  })

export const usePlanEntryDetail = ({
  supabase,
  ownerId,
  entryId,
  enabled = true,
}: {
  supabase: SupabaseClient
  ownerId: string | null
  entryId: string | null
  enabled?: boolean
}): UseQueryResult<PlanEntryRecord | null> =>
  useQuery({
    queryKey: planEntryKeys.detail(ownerId ?? '', entryId ?? ''),
    queryFn: () =>
      getPlanEntry({ supabase, ownerId: ownerId!, entryId: entryId! }),
    enabled: enabled && !!ownerId && !!entryId,
  })

const invalidatePlanEntryCaches = ({
  queryClient,
  ownerId,
  weekStart,
  entryId,
}: {
  queryClient: ReturnType<typeof useQueryClient>
  ownerId: string
  weekStart?: string
  entryId?: string
}) => {
  if (weekStart) {
    void queryClient.invalidateQueries({
      queryKey: planEntryKeys.week(ownerId, weekStart),
    })
  }
  if (entryId) {
    void queryClient.invalidateQueries({
      queryKey: planEntryKeys.detail(ownerId, entryId),
    })
  }
}

export const useUpsertPlanEntry = ({
  supabase,
  ownerId,
}: {
  supabase: SupabaseClient
  ownerId: string
}): UseMutationResult<{ id: string }, Error, UpsertPlanEntryPayload> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertPlanEntryPayload) =>
      upsertPlanEntry({ supabase, ownerId, payload }),
    onSuccess: (_data, variables) =>
      invalidatePlanEntryCaches({
        queryClient,
        ownerId,
        weekStart: variables.week_start,
      }),
  })
}

export const useSoftDeletePlanEntry = ({
  supabase,
  ownerId,
  weekStart,
}: {
  supabase: SupabaseClient
  ownerId: string
  weekStart?: string
}): UseMutationResult<void, Error, { entryId: string }> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId }: { entryId: string }) =>
      softDeletePlanEntry({ supabase, ownerId, entryId }),
    onSuccess: (_data, variables) =>
      invalidatePlanEntryCaches({
        queryClient,
        ownerId,
        weekStart,
        entryId: variables.entryId,
      }),
  })
}
