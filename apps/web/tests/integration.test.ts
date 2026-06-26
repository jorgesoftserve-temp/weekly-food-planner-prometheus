/**
 * Integration tests for MINI_PRD §7 acceptance criteria.
 *
 * Requires local Supabase to be running (`pnpm --filter @recipe-box/supabase db:start`).
 * All credentials fall back to the well-known local-dev defaults so no .env is needed.
 *
 * Scenarios covered:
 *   1. RLS self-scoping  — user B cannot read or write user A's rows
 *   2. Soft-delete visibility — deleted recipes vanish from lists; their plan_entries survive
 *   3. Duplicate-label constraint — same tag label rejected for live rows, allowed after soft-delete
 *   4. Slot-replacement — upsertPlanEntry replaces the recipe on an occupied (week,day,slot)
 */
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createRecipe,
  createTag,
  getRecipe,
  listPlanEntriesForWeek,
  listRecipes,
  softDeleteRecipe,
  softDeleteTag,
  upsertPlanEntry,
} from '@recipe-box/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env['SUPABASE_URL'] ?? 'http://127.0.0.1:54421'
const ANON_KEY =
  process.env['SUPABASE_ANON_KEY'] ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_ROLE_KEY =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Unique suffix per run so repeated runs don't clash on user emails
const RUN_ID = Date.now().toString(36)

// A known Monday (week_start must be the Monday of the target week)
const WEEK_MON = '2026-06-22'

describe('integration: RLS · soft-delete · constraints · slot-replacement', () => {
  let admin: SupabaseClient
  let clientA: SupabaseClient
  let clientB: SupabaseClient
  let userAId: string
  let userBId: string

  // ── setup: create two isolated test users ───────────────────────────────

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    clientA = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    clientB = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const pw = 'Test1234!'
    const emailA = `a_${RUN_ID}@test.invalid`
    const emailB = `b_${RUN_ID}@test.invalid`

    const { data: dataA, error: errA } = await admin.auth.admin.createUser({
      email: emailA,
      password: pw,
      email_confirm: true,
    })
    const { data: dataB, error: errB } = await admin.auth.admin.createUser({
      email: emailB,
      password: pw,
      email_confirm: true,
    })

    if (errA || errB || !dataA.user || !dataB.user) {
      throw new Error(`Test user creation failed — ${errA?.message ?? errB?.message}`)
    }

    userAId = dataA.user.id
    userBId = dataB.user.id

    const { error: signInA } = await clientA.auth.signInWithPassword({ email: emailA, password: pw })
    const { error: signInB } = await clientB.auth.signInWithPassword({ email: emailB, password: pw })
    if (signInA || signInB) {
      throw new Error(`Sign-in failed — ${signInA?.message ?? signInB?.message}`)
    }
  }, 30_000)

  // ── teardown: cascade-delete test users (and all their rows via FK cascade) ─

  afterAll(async () => {
    if (userAId) await admin.auth.admin.deleteUser(userAId)
    if (userBId) await admin.auth.admin.deleteUser(userBId)
  })

  // ── 1. RLS self-scoping ──────────────────────────────────────────────────

  describe('RLS self-scoping', () => {
    it("user B cannot read user A's recipe via list or direct lookup", async () => {
      const { id } = await createRecipe({
        supabase: clientA,
        ownerId: userAId,
        payload: { title: 'RLS read probe' },
      })

      // listRecipes scopes to B's own rows — A's recipe never appears
      const recipesSeenByB = await listRecipes({ supabase: clientB, ownerId: userBId })
      expect(recipesSeenByB.map((r) => r.id)).not.toContain(id)

      // Raw select with A's id also returns null for B (RLS USING filters it out)
      const { data } = await clientB
        .from('recipes')
        .select('id')
        .eq('id', id)
        .maybeSingle()
      expect(data).toBeNull()
    })

    it("user B's UPDATE on user A's recipe is silently discarded by RLS", async () => {
      const { id } = await createRecipe({
        supabase: clientA,
        ownerId: userAId,
        payload: { title: 'RLS write probe' },
      })

      // RLS USING (owner_id = auth.uid()) matches 0 rows for B → silent no-op, no error
      await clientB.from('recipes').update({ title: 'hacked' }).eq('id', id)

      // A's recipe is completely unmodified
      const recipe = await getRecipe({ supabase: clientA, ownerId: userAId, recipeId: id })
      expect(recipe?.title).toBe('RLS write probe')
    })

    it('user B cannot INSERT a row with owner_id forged to user A (RLS WITH CHECK)', async () => {
      const { error } = await clientB.from('recipes').insert({
        owner_id: userAId,
        title: 'Forged recipe',
        ingredients: [],
      })
      // RLS WITH CHECK (owner_id = auth.uid()) must reject this
      expect(error).not.toBeNull()
    })
  })

  // ── 2. Soft-delete visibility ────────────────────────────────────────────

  describe('soft-delete visibility', () => {
    it('soft-deleted recipe disappears from listRecipes', async () => {
      const { id } = await createRecipe({
        supabase: clientA,
        ownerId: userAId,
        payload: { title: 'About to vanish' },
      })

      await softDeleteRecipe({ supabase: clientA, ownerId: userAId, recipeId: id })

      const recipes = await listRecipes({ supabase: clientA, ownerId: userAId })
      expect(recipes.map((r) => r.id)).not.toContain(id)
    })

    it('plan_entry referencing a soft-deleted recipe remains readable', async () => {
      const { id: recipeId } = await createRecipe({
        supabase: clientA,
        ownerId: userAId,
        payload: { title: 'Plan-then-delete recipe' },
      })

      const { id: entryId } = await upsertPlanEntry({
        supabase: clientA,
        ownerId: userAId,
        payload: {
          recipe_id: recipeId,
          week_start: WEEK_MON,
          day_of_week: 2,
          slot: 'breakfast',
        },
      })

      // Soft-delete the recipe (does NOT cascade to plan_entries)
      await softDeleteRecipe({ supabase: clientA, ownerId: userAId, recipeId })

      // Recipe is gone from the list
      const recipes = await listRecipes({ supabase: clientA, ownerId: userAId })
      expect(recipes.map((r) => r.id)).not.toContain(recipeId)

      // Plan entry has its own is_deleted = false — still visible
      const entries = await listPlanEntriesForWeek({
        supabase: clientA,
        ownerId: userAId,
        weekStart: WEEK_MON,
      })
      expect(entries.map((e) => e.id)).toContain(entryId)
    })
  })

  // ── 3. Duplicate-label constraint ────────────────────────────────────────

  describe('duplicate-label constraint (tags)', () => {
    it('second INSERT with the same live label is rejected (partial unique index)', async () => {
      await createTag({
        supabase: clientA,
        ownerId: userAId,
        payload: { label: 'quick' },
      })

      await expect(
        createTag({ supabase: clientA, ownerId: userAId, payload: { label: 'quick' } }),
      ).rejects.toThrow()
    })

    it('same label is accepted after the original tag is soft-deleted', async () => {
      const { id: firstId } = await createTag({
        supabase: clientA,
        ownerId: userAId,
        payload: { label: 'reusable' },
      })

      // Partial unique index only covers WHERE is_deleted = false
      await softDeleteTag({ supabase: clientA, ownerId: userAId, tagId: firstId })

      const { id: secondId } = await createTag({
        supabase: clientA,
        ownerId: userAId,
        payload: { label: 'reusable' },
      })

      expect(typeof secondId).toBe('string')
    })
  })

  // ── 4. Slot-replacement ──────────────────────────────────────────────────

  describe('slot-replacement', () => {
    it('upsert on an occupied (week, day, slot) replaces the recipe and reuses the row', async () => {
      const { id: r1 } = await createRecipe({
        supabase: clientA,
        ownerId: userAId,
        payload: { title: 'Slot occupant A' },
      })
      const { id: r2 } = await createRecipe({
        supabase: clientA,
        ownerId: userAId,
        payload: { title: 'Slot occupant B' },
      })

      const slotKey = { week_start: WEEK_MON, day_of_week: 5, slot: 'dinner' } as const

      // First placement
      const { id: entryId } = await upsertPlanEntry({
        supabase: clientA,
        ownerId: userAId,
        payload: { recipe_id: r1, ...slotKey },
      })

      // Second placement on the same slot
      const { id: afterId } = await upsertPlanEntry({
        supabase: clientA,
        ownerId: userAId,
        payload: { recipe_id: r2, ...slotKey },
      })

      // Same row — no duplicate entry was created
      expect(afterId).toBe(entryId)

      // The slot now points to recipe 2
      const entries = await listPlanEntriesForWeek({
        supabase: clientA,
        ownerId: userAId,
        weekStart: WEEK_MON,
      })
      const occupied = entries.find((e) => e.day_of_week === 5 && e.slot === 'dinner')
      expect(occupied?.recipe_id).toBe(r2)
    })
  })
})
