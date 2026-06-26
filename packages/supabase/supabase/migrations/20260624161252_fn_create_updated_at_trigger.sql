-- Foundation: shared updated_at trigger function for Recipe Box tables.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at IS
  'Sets NEW.updated_at = NOW() on UPDATE. Attach via BEFORE UPDATE trigger.';
