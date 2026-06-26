'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  usePlanEntriesForWeek,
  useUpsertPlanEntry,
  useSoftDeletePlanEntry,
  useRecipesList,
} from '@recipe-box/supabase/react'
import type { MealSlot, PlanEntryRecord } from '@recipe-box/supabase'
import { useSupabase } from '@/hooks/use-supabase'
import { useUserId } from '@/contexts/user-context'

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner']

const toISODate = (d: Date): string => d.toISOString().slice(0, 10)

const getMondayOf = (d: Date): Date => {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const addDays = (d: Date, n: number): Date => {
  const result = new Date(d)
  result.setDate(d.getDate() + n)
  return result
}

const formatWeekLabel = (monday: Date): string => {
  const end = addDays(monday, 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${monday.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}, ${end.getFullYear()}`
}

// ── Cell picker ───────────────────────────────────────────────────────────────

type CellTarget = { dayIndex: number; slot: MealSlot }

const RecipePicker = ({
  target,
  recipes,
  onSelect,
  onClose,
}: {
  target: CellTarget
  recipes: { id: string; title: string }[]
  onSelect: (recipeId: string) => void
  onClose: () => void
}) => (
  <>
    <div className="overlay-backdrop" onClick={onClose} aria-hidden />
    <div
      className="dialog-panel max-h-[70vh] flex flex-col"
      role="dialog"
      aria-modal
      aria-labelledby="picker-title"
    >
      <h2 id="picker-title" className="text-base font-semibold text-gray-900 mb-1">
        Pick a recipe
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        {DAYS[target.dayIndex]} · {target.slot}
      </p>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1">
        {recipes.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No recipes yet.{' '}
            <Link href="/recipes" className="text-blue-600 hover:underline">
              Add some first.
            </Link>
          </p>
        ) : (
          recipes.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className="text-left px-3 py-2 rounded-md text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {r.title}
            </button>
          ))
        )}
      </div>
      <button type="button" className="btn-secondary mt-4" onClick={onClose}>
        Cancel
      </button>
    </div>
  </>
)

// ── Plan page ─────────────────────────────────────────────────────────────────

const PlanPage = () => {
  const supabase = useSupabase()
  const ownerId = useUserId()

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()))
  const weekStartStr = toISODate(weekStart)

  const entriesQuery = usePlanEntriesForWeek({
    supabase,
    ownerId: ownerId || null,
    weekStart: weekStartStr,
  })
  const recipesQuery = useRecipesList({ supabase, ownerId: ownerId || null })

  const upsertEntry = useUpsertPlanEntry({ supabase, ownerId })
  const softDeleteEntry = useSoftDeletePlanEntry({
    supabase,
    ownerId,
    weekStart: weekStartStr,
  })

  const [pickerTarget, setPickerTarget] = useState<CellTarget | null>(null)

  const entries = entriesQuery.data ?? []
  const recipes = recipesQuery.data ?? []

  const getEntry = (dayIndex: number, slot: MealSlot): PlanEntryRecord | undefined =>
    entries.find((e) => e.day_of_week === dayIndex && e.slot === slot)

  const getRecipeTitle = (recipeId: string): string =>
    recipes.find((r) => r.id === recipeId)?.title ?? '…'

  const handleCellClick = (dayIndex: number, slot: MealSlot) => {
    const entry = getEntry(dayIndex, slot)
    if (entry) {
      softDeleteEntry.mutate({ entryId: entry.id })
    } else {
      setPickerTarget({ dayIndex, slot })
    }
  }

  const handlePickRecipe = async (recipeId: string) => {
    if (!pickerTarget) return
    await upsertEntry.mutateAsync({
      recipe_id: recipeId,
      week_start: weekStartStr,
      day_of_week: pickerTarget.dayIndex,
      slot: pickerTarget.slot,
    })
    setPickerTarget(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Week plan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Click an empty cell to place a recipe · click a filled cell to clear it
          </p>
        </div>
        {/* Week navigator */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary p-2"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[220px] text-center">
            {formatWeekLabel(weekStart)}
          </span>
          <button
            type="button"
            className="btn-secondary p-2"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn-ghost text-xs text-gray-500"
            onClick={() => setWeekStart(getMondayOf(new Date()))}
          >
            Today
          </button>
        </div>
      </div>

      {/* Grid */}
      {entriesQuery.isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="w-24 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide pr-3" />
                {DAYS.map((day, i) => {
                  const date = addDays(weekStart, i)
                  const isToday = toISODate(date) === toISODate(new Date())
                  return (
                    <th
                      key={day}
                      className={[
                        'py-2 text-center text-xs font-medium uppercase tracking-wide',
                        isToday ? 'text-blue-600' : 'text-gray-500',
                      ].join(' ')}
                    >
                      <div>{day}</div>
                      <div
                        className={[
                          'text-base font-semibold mt-0.5',
                          isToday ? 'text-blue-600' : 'text-gray-800',
                        ].join(' ')}
                      >
                        {date.getDate()}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot} className="border-t border-gray-100">
                  <td className="py-2 pr-3 text-xs font-medium text-gray-500 capitalize align-top pt-3">
                    {slot}
                  </td>
                  {DAYS.map((_, dayIndex) => {
                    const entry = getEntry(dayIndex, slot)
                    const isDeleting =
                      softDeleteEntry.isPending &&
                      entry &&
                      softDeleteEntry.variables?.entryId === entry.id

                    return (
                      <td key={dayIndex} className="py-1 px-1 align-top">
                        {entry ? (
                          <button
                            type="button"
                            onClick={() => handleCellClick(dayIndex, slot)}
                            disabled={!!isDeleting}
                            className={[
                              'w-full group relative rounded-md px-2 py-2 text-xs text-left transition-colors border',
                              isDeleting
                                ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                                : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-red-50 hover:border-red-200 hover:text-red-700',
                            ].join(' ')}
                            title={`Clear ${DAYS[dayIndex]} ${slot}`}
                          >
                            <span className="block truncate font-medium leading-snug">
                              {getRecipeTitle(entry.recipe_id)}
                            </span>
                            <X className="absolute top-1 right-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCellClick(dayIndex, slot)}
                            className="w-full rounded-md border border-dashed border-gray-200 px-2 py-2 text-xs text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-500 transition-colors min-h-[3.5rem]"
                            title={`Add recipe to ${DAYS[dayIndex]} ${slot}`}
                          >
                            + add
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recipe picker */}
      {pickerTarget && (
        <RecipePicker
          target={pickerTarget}
          recipes={recipes}
          onSelect={handlePickRecipe}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  )
}

export default PlanPage
