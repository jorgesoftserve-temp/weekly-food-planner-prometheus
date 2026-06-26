'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  notes: z.string().max(5000).optional(),
  ingredients: z.array(z.string().min(1, 'Line cannot be empty')).default([]),
})

export type RecipeFormValues = z.infer<typeof recipeSchema>

export const RecipeForm = ({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<RecipeFormValues>
  onSubmit: ({ values }: { values: RecipeFormValues }) => void
  isSubmitting?: boolean
}) => {
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: '',
      notes: '',
      ingredients: [],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'ingredients' as never,
  })

  return (
    <form
      onSubmit={form.handleSubmit((values) => onSubmit({ values }))}
      className="flex flex-col gap-4"
    >
      <div>
        <label className="field-label" htmlFor="recipe-title">
          Title
        </label>
        <input
          id="recipe-title"
          className="field-input"
          placeholder="e.g. Pasta carbonara"
          {...form.register('title')}
        />
        {form.formState.errors.title && (
          <p className="field-error">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="field-label" htmlFor="recipe-notes">
          Notes
        </label>
        <textarea
          id="recipe-notes"
          className="field-input min-h-[100px] resize-y"
          placeholder="Method, tips, variations…"
          {...form.register('notes')}
        />
      </div>

      <div>
        <p className="field-label">Ingredients</p>
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-center">
              <input
                className="field-input flex-1"
                placeholder={`Ingredient ${index + 1}`}
                {...form.register(`ingredients.${index}`)}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="btn-ghost p-2 rounded-md text-gray-500 hover:text-red-600"
                aria-label="Remove ingredient"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => append('')}
            className="btn-secondary self-start flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add ingredient
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save recipe'}
      </button>
    </form>
  )
}
