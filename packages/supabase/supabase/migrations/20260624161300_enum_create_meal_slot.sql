-- MINI_PRD §4.3 — meal slot enum for plan_entries.

CREATE TYPE public.meal_slot AS ENUM ('breakfast', 'lunch', 'dinner');

COMMENT ON TYPE public.meal_slot IS
  'Which meal a plan entry occupies within a day (breakfast, lunch, or dinner).';
