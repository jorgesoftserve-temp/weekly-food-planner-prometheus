'use client'

import { useSoftDeleteRecipe } from '@recipe-box/supabase/react'
import { useSupabase } from '@/hooks/use-supabase'
import { useUserId } from '@/contexts/user-context'
import type { RecipeRecord } from '@recipe-box/supabase'

export const DeleteRecipeDialog = ({
  recipe,
  open,
  onOpenChange,
}: {
  recipe: RecipeRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const supabase = useSupabase()
  const ownerId = useUserId()

  const softDelete = useSoftDeleteRecipe({ supabase, ownerId })

  if (!open || !recipe) return null

  const handleConfirm = async () => {
    await softDelete.mutateAsync({ recipeId: recipe.id })
    onOpenChange(false)
  }

  return (
    <>
      <div
        className="overlay-backdrop"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal
        aria-labelledby="delete-recipe-title"
        className="dialog-panel"
      >
        <h2
          id="delete-recipe-title"
          className="text-lg font-semibold text-gray-900 mb-2"
        >
          Delete &ldquo;{recipe.title}&rdquo;?
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          This recipe will be soft-deleted and hidden from your list. Past plan
          entries that referenced it remain intact.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={softDelete.isPending}
            onClick={handleConfirm}
          >
            {softDelete.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </>
  )
}
