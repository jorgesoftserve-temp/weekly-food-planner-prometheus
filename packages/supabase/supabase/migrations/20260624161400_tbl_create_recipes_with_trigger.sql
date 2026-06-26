-- MINI_PRD §4.1 — personal recipe library (self-scoped, soft-delete).

CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.recipes IS
  'Personal recipe library row owned by a single auth.users id. Soft-deleted rows are hidden from reads.';

COMMENT ON COLUMN public.recipes.title IS 'Recipe name.';
COMMENT ON COLUMN public.recipes.notes IS 'Free-text method / notes.';
COMMENT ON COLUMN public.recipes.ingredients IS 'One free-text line per array element.';

CREATE UNIQUE INDEX uq_recipes_owner_title
  ON public.recipes (owner_id, lower(title))
  WHERE is_deleted = FALSE;

CREATE INDEX idx_recipes_owner_active
  ON public.recipes (owner_id)
  WHERE is_deleted = FALSE;

CREATE TRIGGER trg_recipes_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY recipes_select_own ON public.recipes
FOR SELECT TO authenticated
USING (owner_id = auth.uid() AND is_deleted = FALSE);

CREATE POLICY recipes_insert_own ON public.recipes
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY recipes_update_own ON public.recipes
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY recipes_delete_own ON public.recipes
FOR DELETE TO authenticated
USING (owner_id = auth.uid());
