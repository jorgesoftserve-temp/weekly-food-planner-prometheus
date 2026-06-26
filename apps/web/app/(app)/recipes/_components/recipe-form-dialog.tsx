'use client'

import {
  useCreateRecipe,
  useUpdateRecipe,
  useRecipeDetail,
} from '@recipe-box/supabase/react'
import { useSupabase } from '@/hooks/use-supabase'
import { useUserId } from '@/contexts/user-context'
import { RecipeForm, type RecipeFormValues } from './recipe-form'
import { X } from 'lucide-react'

export const RecipeFormDialog = ({
  mode,
  recipeId,
  open,
  onOpenChange,
}: {
  mode: 'create' | 'edit'
  recipeId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const supabase = useSupabase()
  const ownerId = useUserId()

  const detailQuery = useRecipeDetail({
    supabase,
    ownerId,
    recipeId: recipeId ?? null,
    enabled: mode === 'edit' && !!recipeId,
  })

  const createMutation = useCreateRecipe({ supabase, ownerId })
  const updateMutation = useUpdateRecipe({
    supabase,
    ownerId,
    recipeId: recipeId ?? '',
  })

  if (!open) return null

  const handleSubmit = async ({ values }: { values: RecipeFormValues }) => {
    if (mode === 'create') {
      await createMutation.mutateAsync({
        title: values.title,
        notes: values.notes || null,
        ingredients: values.ingredients,
      })
    } else if (recipeId) {
      await updateMutation.mutateAsync({
        title: values.title,
        notes: values.notes || null,
        ingredients: values.ingredients,
      })
    }
    onOpenChange(false)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isLoadingDetail = mode === 'edit' && detailQuery.isLoading

  const defaultValues: Partial<RecipeFormValues> =
    mode === 'edit' && detailQuery.data
      ? {
          title: detailQuery.data.title,
          notes: detailQuery.data.notes ?? '',
          ingredients: detailQuery.data.ingredients,
        }
      : {}

  return (
    <>
      <div
        className="overlay-backdrop"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div className="sheet-panel" role="dialog" aria-modal aria-labelledby="recipe-dialog-title">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="recipe-dialog-title" className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'New recipe' : 'Edit recipe'}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="btn-ghost p-1 rounded"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              Loading…
            </div>
          ) : (
            <RecipeForm
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </>
  )
}
