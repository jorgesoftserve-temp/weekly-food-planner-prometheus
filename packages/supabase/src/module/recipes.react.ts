import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createRecipe,
  getRecipe,
  listRecipes,
  recipeKeys,
  softDeleteRecipe,
  updateRecipe,
  type CreateRecipePayload,
  type RecipeRecord,
  type UpdateRecipePatch,
} from './recipes.js'

export const useRecipesList = ({
  supabase,
  ownerId,
  enabled = true,
}: {
  supabase: SupabaseClient
  ownerId: string | null
  enabled?: boolean
}): UseQueryResult<RecipeRecord[]> =>
  useQuery({
    queryKey: recipeKeys.list(ownerId ?? ''),
    queryFn: () => listRecipes({ supabase, ownerId: ownerId! }),
    enabled: enabled && !!ownerId,
  })

export const useRecipeDetail = ({
  supabase,
  ownerId,
  recipeId,
  enabled = true,
}: {
  supabase: SupabaseClient
  ownerId: string | null
  recipeId: string | null
  enabled?: boolean
}): UseQueryResult<RecipeRecord | null> =>
  useQuery({
    queryKey: recipeKeys.detail(ownerId ?? '', recipeId ?? ''),
    queryFn: () =>
      getRecipe({ supabase, ownerId: ownerId!, recipeId: recipeId! }),
    enabled: enabled && !!ownerId && !!recipeId,
  })

const invalidateRecipeCaches = ({
  queryClient,
  ownerId,
  recipeId,
}: {
  queryClient: ReturnType<typeof useQueryClient>
  ownerId: string
  recipeId?: string
}) => {
  void queryClient.invalidateQueries({ queryKey: recipeKeys.list(ownerId) })
  if (recipeId) {
    void queryClient.invalidateQueries({
      queryKey: recipeKeys.detail(ownerId, recipeId),
    })
  }
}

export const useCreateRecipe = ({
  supabase,
  ownerId,
}: {
  supabase: SupabaseClient
  ownerId: string
}): UseMutationResult<{ id: string }, Error, CreateRecipePayload> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRecipePayload) =>
      createRecipe({ supabase, ownerId, payload }),
    onSuccess: () => invalidateRecipeCaches({ queryClient, ownerId }),
  })
}

export const useUpdateRecipe = ({
  supabase,
  ownerId,
  recipeId,
}: {
  supabase: SupabaseClient
  ownerId: string
  recipeId: string
}): UseMutationResult<void, Error, UpdateRecipePatch> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: UpdateRecipePatch) =>
      updateRecipe({ supabase, ownerId, recipeId, patch }),
    onSuccess: () =>
      invalidateRecipeCaches({ queryClient, ownerId, recipeId }),
  })
}

export const useSoftDeleteRecipe = ({
  supabase,
  ownerId,
}: {
  supabase: SupabaseClient
  ownerId: string
}): UseMutationResult<void, Error, { recipeId: string }> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ recipeId }: { recipeId: string }) =>
      softDeleteRecipe({ supabase, ownerId, recipeId }),
    onSuccess: (_data, variables) =>
      invalidateRecipeCaches({
        queryClient,
        ownerId,
        recipeId: variables.recipeId,
      }),
  })
}
