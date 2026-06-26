-- MINI_PRD §4.2 — recipe ↔ tag junction (hard-delete on unlink, no is_deleted).

CREATE TABLE public.recipe_tags (
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

COMMENT ON TABLE public.recipe_tags IS
  'Links recipes to tags for the owning user. Rows are hard-deleted on detach.';

CREATE INDEX idx_recipe_tags_owner
  ON public.recipe_tags (owner_id);

CREATE INDEX idx_recipe_tags_tag
  ON public.recipe_tags (tag_id);

ALTER TABLE public.recipe_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY recipe_tags_select_own ON public.recipe_tags
FOR SELECT TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY recipe_tags_insert_own ON public.recipe_tags
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY recipe_tags_update_own ON public.recipe_tags
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY recipe_tags_delete_own ON public.recipe_tags
FOR DELETE TO authenticated
USING (owner_id = auth.uid());
