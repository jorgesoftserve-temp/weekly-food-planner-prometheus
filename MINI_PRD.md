# MINI PRD — Recipe Box (toy spec)

> **Status: scratch / test fixture.** This is a deliberately small, self-contained spec derived from
> the Weekly Food Planner. It exists to exercise code-generation skills end-to-end against a realistic
> but minimal target. It is **not** part of the shipped product and is not cross-referenced by the real
> PRDs under [`docs/PRD/`](./). When in doubt, the five canonical PRDs win.

## 1. Overview

**Recipe Box** is a single-user web app for storing recipes and laying them out on a simple, manual
weekly plan. There is no constraint engine, no households, and no automatic generation — the user
drags recipes onto days themselves. The point is a small CRUD surface that still touches every layer
of the real stack (auth, schema + RLS, data modules, route handlers, UI).

### What it is NOT (vs. the real product)
- No groups / members / roles — every row is owned by exactly one `auth.users` id.
- No constraint-based menu generation, no seeded RNG, no determinism contract.
- No grocery aggregation, no freshness grouping, no PDF layout.
- No images/storage (recipes are text-only).

## 2. Users & goals

A single authenticated user who wants to:
- Keep a personal library of recipes (title, notes, free-text ingredient lines, tags).
- Drop recipes onto the seven days of a week to sketch what they'll cook.
- Edit and soft-delete recipes without losing plan history.

## 3. Stack (inherited, unchanged)

Same as the monorepo: Next.js 15 App Router + React 19 + TS + Tailwind + shadcn/ui; Supabase
(Auth + Postgres + RLS); TanStack Query for server data; react-hook-form + Zod. The repo
non-negotiables in [`CLAUDE.md`](../../CLAUDE.md) still apply — three Supabase clients, types via the
package barrel, RO-RO, fat-arrow + one-export-per-file + kebab-case, soft delete default.

## 4. Data model

Three tables, all soft-delete (`is_deleted boolean not null default false`), all with
`id uuid pk default gen_random_uuid()`, `owner_id uuid not null references auth.users(id)`,
`created_at`/`updated_at timestamptz not null default now()` and an `updated_at` trigger.

### 4.1 `recipes`
| column | type | notes |
|---|---|---|
| `title` | `text not null` | recipe name |
| `notes` | `text` | free-text method / notes, nullable |
| `ingredients` | `text[] not null default '{}'` | one free-text line per ingredient |

Partial unique on `(owner_id, lower(title)) where is_deleted = false`.

### 4.2 `tags`
| column | type | notes |
|---|---|---|
| `label` | `text not null` | e.g. "quick", "vegetarian" |
| `color` | `text` | optional hex token, nullable |

Partial unique on `(owner_id, lower(label)) where is_deleted = false`.

A `recipe_tags` junction table links recipes ↔ tags: `recipe_id`, `tag_id`, `owner_id`,
unique on `(recipe_id, tag_id)`. (Hard-delete on unlink is fine; the junction has no `is_deleted`.)

### 4.3 `plan_entries`
A single recipe placed on one day of a week.
| column | type | notes |
|---|---|---|
| `recipe_id` | `uuid not null references recipes(id)` | which recipe |
| `week_start` | `date not null` | Monday of the target week |
| `day_of_week` | `int not null check (day_of_week between 0 and 6)` | 0 = Monday |
| `slot` | `text not null default 'dinner'` | `'breakfast' \| 'lunch' \| 'dinner'` (enum `meal_slot`) |

Partial unique on `(owner_id, week_start, day_of_week, slot) where is_deleted = false`
(one recipe per slot per day).

### 4.4 RLS (all tables)
Every policy is self-scoped: `owner_id = auth.uid()` for select/insert/update/delete, and read
policies additionally filter `is_deleted = false`.

## 5. API surface

Standard route handlers under `apps/web/app/api/`, three-client rule, awaited `params`/`cookies()`,
Zod-validated bodies, `{ error, detail }` envelope.

| Method + path | Purpose |
|---|---|
| `GET /api/recipes` | list current user's recipes (not deleted) |
| `POST /api/recipes` | create a recipe |
| `GET /api/recipes/[id]` | fetch one |
| `PATCH /api/recipes/[id]` | update title/notes/ingredients |
| `DELETE /api/recipes/[id]` | soft-delete |
| `GET /api/tags` / `POST /api/tags` | list / create tags |
| `POST /api/recipes/[id]/tags` | attach/detach tags (body: `{ tagIds: string[] }`) |
| `GET /api/plan?weekStart=YYYY-MM-DD` | entries for a week |
| `POST /api/plan` | place a recipe on a slot (upsert on the partial-unique key) |
| `DELETE /api/plan/[id]` | soft-delete a plan entry |

## 6. UI surface

- `/recipes` — list + create dialog + edit dialog + soft-delete confirm (canonical feature-folder shape).
- `/recipes/[id]` — read view with tags and ingredient lines.
- `/plan` — a 7-column week grid; pick a recipe + slot to fill a cell; clear a cell to remove it.

## 7. Acceptance criteria

- A signed-in user can create, edit, list, and soft-delete recipes; deleted recipes disappear from
  lists but their past `plan_entries` remain readable.
- Tags can be created and attached/detached; the same label can't be created twice (live rows).
- A recipe can be placed on a (week, day, slot); placing another on the same slot replaces it.
- RLS prevents any user from reading or writing another user's rows (covered by an integration test).
- `pnpm typecheck && pnpm test` pass.

## 8. Suggested build order (for code-gen runs)

1. Migration set: `enum_ meal_slot` → `tbl_ recipes` / `tags` / `recipe_tags` / `plan_entries` → RLS.
   (→ `new-table-migration` skill / `supabase-migration-author`.)
2. Regenerate types, then data-layer modules + hooks per table. (→ `add-module-and-hooks`.)
3. Route handlers per §5. (→ `add-route-handler`.)
4. Feature folders for `/recipes` and `/plan`. (→ `feature-folder-scaffold`.)
5. Integration test for the RLS self-scoping + soft-delete visibility. (→ `vitest-integration-author`.)
