-- MINI_PRD §4.3 — weekly plan slot (self-scoped, soft-delete).

CREATE TABLE public.plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id),
  week_start DATE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  slot public.meal_slot NOT NULL DEFAULT 'dinner',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.plan_entries IS
  'A recipe placed on one day/slot of a week. Soft-deleted rows are hidden from reads; '
  'entries remain readable even when the linked recipe is soft-deleted.';

COMMENT ON COLUMN public.plan_entries.week_start IS 'Monday of the target week.';
COMMENT ON COLUMN public.plan_entries.day_of_week IS '0 = Monday through 6 = Sunday.';
COMMENT ON COLUMN public.plan_entries.slot IS 'Meal slot within the day.';

CREATE UNIQUE INDEX uq_plan_entries_owner_week_day_slot
  ON public.plan_entries (owner_id, week_start, day_of_week, slot)
  WHERE is_deleted = FALSE;

CREATE INDEX idx_plan_entries_owner_week_active
  ON public.plan_entries (owner_id, week_start)
  WHERE is_deleted = FALSE;

CREATE INDEX idx_plan_entries_recipe
  ON public.plan_entries (recipe_id);

CREATE TRIGGER trg_plan_entries_updated_at
BEFORE UPDATE ON public.plan_entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.plan_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_entries_select_own ON public.plan_entries
FOR SELECT TO authenticated
USING (owner_id = auth.uid() AND is_deleted = FALSE);

CREATE POLICY plan_entries_insert_own ON public.plan_entries
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY plan_entries_update_own ON public.plan_entries
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY plan_entries_delete_own ON public.plan_entries
FOR DELETE TO authenticated
USING (owner_id = auth.uid());
