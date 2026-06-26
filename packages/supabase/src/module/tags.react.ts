import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createTag,
  getTag,
  listTags,
  softDeleteTag,
  tagKeys,
  updateTag,
  type CreateTagPayload,
  type TagRecord,
  type UpdateTagPatch,
} from './tags.js'

export const useTagsList = ({
  supabase,
  ownerId,
  enabled = true,
}: {
  supabase: SupabaseClient
  ownerId: string | null
  enabled?: boolean
}): UseQueryResult<TagRecord[]> =>
  useQuery({
    queryKey: tagKeys.list(ownerId ?? ''),
    queryFn: () => listTags({ supabase, ownerId: ownerId! }),
    enabled: enabled && !!ownerId,
  })

export const useTagDetail = ({
  supabase,
  ownerId,
  tagId,
  enabled = true,
}: {
  supabase: SupabaseClient
  ownerId: string | null
  tagId: string | null
  enabled?: boolean
}): UseQueryResult<TagRecord | null> =>
  useQuery({
    queryKey: tagKeys.detail(ownerId ?? '', tagId ?? ''),
    queryFn: () => getTag({ supabase, ownerId: ownerId!, tagId: tagId! }),
    enabled: enabled && !!ownerId && !!tagId,
  })

const invalidateTagCaches = ({
  queryClient,
  ownerId,
  tagId,
}: {
  queryClient: ReturnType<typeof useQueryClient>
  ownerId: string
  tagId?: string
}) => {
  void queryClient.invalidateQueries({ queryKey: tagKeys.list(ownerId) })
  if (tagId) {
    void queryClient.invalidateQueries({
      queryKey: tagKeys.detail(ownerId, tagId),
    })
  }
}

export const useCreateTag = ({
  supabase,
  ownerId,
}: {
  supabase: SupabaseClient
  ownerId: string
}): UseMutationResult<{ id: string }, Error, CreateTagPayload> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTagPayload) =>
      createTag({ supabase, ownerId, payload }),
    onSuccess: () => invalidateTagCaches({ queryClient, ownerId }),
  })
}

export const useUpdateTag = ({
  supabase,
  ownerId,
  tagId,
}: {
  supabase: SupabaseClient
  ownerId: string
  tagId: string
}): UseMutationResult<void, Error, UpdateTagPatch> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: UpdateTagPatch) =>
      updateTag({ supabase, ownerId, tagId, patch }),
    onSuccess: () => invalidateTagCaches({ queryClient, ownerId, tagId }),
  })
}

export const useSoftDeleteTag = ({
  supabase,
  ownerId,
}: {
  supabase: SupabaseClient
  ownerId: string
}): UseMutationResult<void, Error, { tagId: string }> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tagId }: { tagId: string }) =>
      softDeleteTag({ supabase, ownerId, tagId }),
    onSuccess: (_data, variables) =>
      invalidateTagCaches({
        queryClient,
        ownerId,
        tagId: variables.tagId,
      }),
  })
}
