-- PostgREST 12+ changed the default return preference for PATCH to return=representation.
-- When a soft-delete UPDATE (is_deleted = false → true) completes, PostgREST evaluates the
-- updated row through the SELECT policy via RETURNING. Because the SELECT policy included
-- `is_deleted = FALSE`, the now-deleted row became invisible, and PostgREST 14 raised
-- "new row violates row-level security policy" instead of returning empty.
--
-- Fix: remove `AND is_deleted = FALSE` from SELECT USING on all three tables.
-- Ownership scoping (owner_id = auth.uid()) is sufficient for RLS; soft-delete visibility
-- is already enforced at the application layer in every list/get query.

-- recipes
DROP POLICY recipes_select_own ON public.recipes;
CREATE POLICY recipes_select_own ON public.recipes
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- tags
DROP POLICY tags_select_own ON public.tags;
CREATE POLICY tags_select_own ON public.tags
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- plan_entries
DROP POLICY plan_entries_select_own ON public.plan_entries;
CREATE POLICY plan_entries_select_own ON public.plan_entries
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
