'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, Tag } from 'lucide-react'
import {
  useRecipeDetail,
  useRecipeTags,
  useTagsList,
  useSetRecipeTags,
  useCreateTag,
} from '@recipe-box/supabase/react'
import { useSupabase } from '@/hooks/use-supabase'
import { useUserId } from '@/contexts/user-context'
import { RecipeFormDialog } from '../_components/recipe-form-dialog'

const RecipeDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id: recipeId } = use(params)
  const supabase = useSupabase()
  const ownerId = useUserId()

  const recipeQuery = useRecipeDetail({ supabase, ownerId, recipeId })
  const tagsQuery = useRecipeTags({ supabase, ownerId, recipeId })
  const allTagsQuery = useTagsList({ supabase, ownerId: ownerId || null })
  const setTagsMutation = useSetRecipeTags({ supabase, ownerId, recipeId })

  const createTagMutation = useCreateTag({ supabase, ownerId: ownerId ?? '' })

  const [editOpen, setEditOpen] = useState(false)
  const [tagsEditing, setTagsEditing] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newTagLabel, setNewTagLabel] = useState('')

  if (recipeQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-6 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  const recipe = recipeQuery.data
  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-gray-500">Recipe not found.</p>
        <Link href="/recipes" className="btn-secondary">
          Back to recipes
        </Link>
      </div>
    )
  }

  const recipeTags = tagsQuery.data ?? []
  const allTags = allTagsQuery.data ?? []

  const handleOpenTagsEditor = () => {
    setSelectedTagIds(recipeTags.map((t) => t.id))
    setNewTagLabel('')
    setTagsEditing(true)
  }

  const handleSaveTags = async () => {
    await setTagsMutation.mutateAsync({ tagIds: selectedTagIds })
    setTagsEditing(false)
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const handleCreateTag = async () => {
    const label = newTagLabel.trim()
    if (!label) return
    const { id } = await createTagMutation.mutateAsync({ label })
    setSelectedTagIds((prev) => [...prev, id])
    setNewTagLabel('')
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back link */}
      <Link
        href="/recipes"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 self-start"
      >
        <ArrowLeft className="h-4 w-4" />
        Recipes
      </Link>

      {/* Title + edit */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="btn-secondary flex items-center gap-2 flex-shrink-0"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      </div>

      {/* Tags */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Tags</span>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline ml-auto"
            onClick={handleOpenTagsEditor}
          >
            {recipeTags.length === 0 ? 'Add tags' : 'Edit tags'}
          </button>
        </div>
        {recipeTags.length === 0 ? (
          <p className="text-sm text-gray-400 ml-6">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 ml-6">
            {recipeTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                  color: tag.color ?? '#374151',
                  border: `1px solid ${tag.color ?? '#e5e7eb'}`,
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Notes */}
      {recipe.notes && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-gray-700">Notes</h2>
          <div className="card px-4 py-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {recipe.notes}
            </p>
          </div>
        </section>
      )}

      {/* Ingredients */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-700">
          Ingredients
          {recipe.ingredients.length > 0 && (
            <span className="ml-1 text-gray-400 font-normal">
              ({recipe.ingredients.length})
            </span>
          )}
        </h2>
        {recipe.ingredients.length === 0 ? (
          <p className="text-sm text-gray-400">No ingredients listed.</p>
        ) : (
          <ul className="card overflow-hidden divide-y divide-gray-100">
            {recipe.ingredients.map((line, i) => (
              <li key={i} className="px-4 py-2.5 text-sm text-gray-700">
                {line}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Edit recipe dialog */}
      <RecipeFormDialog
        mode="edit"
        recipeId={recipeId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Tags editor overlay */}
      {tagsEditing && (
        <>
          <div
            className="overlay-backdrop"
            onClick={() => setTagsEditing(false)}
            aria-hidden
          />
          <div className="dialog-panel" role="dialog" aria-modal aria-labelledby="tags-editor-title">
            <h2 id="tags-editor-title" className="text-lg font-semibold text-gray-900 mb-4">
              Edit tags
            </h2>
            {allTags.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">
                No tags exist yet. Create some from the tags API first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-6">
                {allTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={[
                        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors',
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
                      ].join(' ')}
                    >
                      {tag.label}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Create a new tag</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  placeholder="Tag label"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); void handleCreateTag() }
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary text-sm px-3"
                  disabled={!newTagLabel.trim() || createTagMutation.isPending || !ownerId}
                  onClick={() => { void handleCreateTag() }}
                >
                  {createTagMutation.isPending ? '…' : 'Add'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setTagsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={setTagsMutation.isPending}
                onClick={handleSaveTags}
              >
                {setTagsMutation.isPending ? 'Saving…' : 'Save tags'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RecipeDetailPage
