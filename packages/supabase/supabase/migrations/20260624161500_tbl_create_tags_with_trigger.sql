-- MINI_PRD §4.2 — personal tags (self-scoped, soft-delete).

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tags IS
  'Personal tag labels for recipes. Soft-deleted rows are hidden from reads.';

COMMENT ON COLUMN public.tags.label IS 'Display label, e.g. quick or vegetarian.';
COMMENT ON COLUMN public.tags.color IS 'Optional hex colour token.';

CREATE UNIQUE INDEX uq_tags_owner_label
  ON public.tags (owner_id, lower(label))
  WHERE is_deleted = FALSE;

CREATE INDEX idx_tags_owner_active
  ON public.tags (owner_id)
  WHERE is_deleted = FALSE;

CREATE TRIGGER trg_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY tags_select_own ON public.tags
FOR SELECT TO authenticated
USING (owner_id = auth.uid() AND is_deleted = FALSE);

CREATE POLICY tags_insert_own ON public.tags
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY tags_update_own ON public.tags
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY tags_delete_own ON public.tags
FOR DELETE TO authenticated
USING (owner_id = auth.uid());
