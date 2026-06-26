'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { useRecipesList } from '@recipe-box/supabase/react'
import type { RecipeRecord } from '@recipe-box/supabase'
import { useSupabase } from '@/hooks/use-supabase'
import { useUserId } from '@/contexts/user-context'
import { RecipeFormDialog } from './_components/recipe-form-dialog'
import { DeleteRecipeDialog } from './_components/delete-recipe-dialog'

type EditTarget = { mode: 'create' } | { mode: 'edit'; recipeId: string }

const RecipesPage = () => {
  const supabase = useSupabase()
  const ownerId = useUserId()

  const recipesQuery = useRecipesList({ supabase, ownerId: ownerId || null })

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [pendingDelete, setPendingDelete] = useState<RecipeRecord | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const dialogOpen = editTarget !== null
  const deleteOpen = pendingDelete !== null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your personal recipe library
          </p>
        </div>
        <button
          type="button"
          className="btn-primary flex items-center gap-2"
          onClick={() => setEditTarget({ mode: 'create' })}
        >
          <Plus className="h-4 w-4" />
          New recipe
        </button>
      </div>

      {/* Content */}
      {recipesQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : recipesQuery.data?.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-3">
          <p className="text-gray-500 text-sm">No recipes yet.</p>
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={() => setEditTarget({ mode: 'create' })}
          >
            <Plus className="h-4 w-4" />
            Add your first recipe
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">
                  Ingredients
                </th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recipesQuery.data?.map((recipe) => (
                <tr key={recipe.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3">
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1"
                    >
                      {recipe.title}
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    {recipe.notes && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                        {recipe.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {recipe.ingredients.length > 0
                      ? `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? '' : 's'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      type="button"
                      className="btn-ghost p-1 rounded"
                      aria-label="Recipe actions"
                      onClick={() =>
                        setOpenMenu(openMenu === recipe.id ? null : recipe.id)
                      }
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenu === recipe.id && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setOpenMenu(null)}
                          aria-hidden
                        />
                        <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-36">
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setOpenMenu(null)
                              setEditTarget({ mode: 'edit', recipeId: recipe.id })
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setOpenMenu(null)
                              setPendingDelete(recipe)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      <RecipeFormDialog
        mode={editTarget?.mode === 'edit' ? 'edit' : 'create'}
        recipeId={editTarget?.mode === 'edit' ? editTarget.recipeId : undefined}
        open={dialogOpen}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
      />

      <DeleteRecipeDialog
        recipe={pendingDelete}
        open={deleteOpen}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
      />
    </div>
  )
}

export default RecipesPage
