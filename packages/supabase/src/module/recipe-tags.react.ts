import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { TagRecord } from './tags.js'
import { recipeKeys } from './recipes.js'
import {
  listTagsForRecipe,
  recipeTagKeys,
  setRecipeTags,
} from './recipe-tags.js'

export const useRecipeTags = ({
  supabase,
  ownerId,
  recipeId,
  enabled = true,
}: {
  supabase: SupabaseClient
  ownerId: string | null
  recipeId: string | null
  enabled?: boolean
}): UseQueryResult<TagRecord[]> =>
  useQuery({
    queryKey: recipeTagKeys.forRecipe(ownerId ?? '', recipeId ?? ''),
    queryFn: () => listTagsForRecipe({ supabase, recipeId: recipeId! }),
    enabled: enabled && !!ownerId && !!recipeId,
  })

export const useSetRecipeTags = ({
  supabase,
  ownerId,
  recipeId,
}: {
  supabase: SupabaseClient
  ownerId: string
  recipeId: string
}): UseMutationResult<void, Error, { tagIds: string[] }> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tagIds }: { tagIds: string[] }) =>
      setRecipeTags({ supabase, ownerId, recipeId, tagIds }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: recipeTagKeys.forRecipe(ownerId, recipeId),
      })
      void queryClient.invalidateQueries({
        queryKey: recipeKeys.detail(ownerId, recipeId),
      })
    },
  })
}
