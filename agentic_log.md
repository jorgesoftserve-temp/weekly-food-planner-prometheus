# Agentic log — Recipe Box

Tracks which **Deployment MCP** (`user-Deployment`) skills and tools were used per agent session, plus a running implementation review.

> **Rule:** Always try remote MCP skills first (`get_platform_guide` → `skills_search` → `skill_get`). If no match, log it here and note what fallback was used (if any).

---

## Remote MCP catalog (as of 2026-06-24)

Skills available on the Deployment MCP server:

| Skill ID | Description |
|---|---|
| `terraform-quality-gate` | Terraform fmt / validate / tflint / plan |
| `terraform-app-investigation` | App runtime discovery for infra planning |
| `simple-service-infrastructure-planner` | MVP service infrastructure design |
| `cicd-simple-pipeline-planner` | MVP CI/CD pipeline planning |

**Not on remote MCP** (exist only in parent monorepo `Pet project/.claude/skills/`):

- `add-module-and-hooks`
- `add-route-handler`
- `feature-folder-scaffold`
- `new-table-migration`
- `supabase-add-column`
- …others

---

## Session log

### Session 1 — Recipe Box API surface (MINI_PRD §5)

**Date:** 2026-06-24  
**Goal:** Scaffold data-layer module pairs (`recipes`, `tags`, `recipe-tags`, `plan-entries`) and build all §5 route handlers.

| MCP tool / skill | Used? | Result |
|---|---|---|
| `get_platform_guide` | ✅ | Read platform workflow |
| `skills_search` | ✅ | No matches for module/route/recipe queries |
| `skill_get` | ❌ | Not called before implementing (workflow gap) |
| `get_skills_archive` | ❌ | Not called in this session |
| `skill_file_get` | ❌ | N/A |

**Fallback guidance used:** Local skill docs from `Pet project/.claude/skills/add-module-and-hooks` and `add-route-handler` (not fetched via MCP).

**Deliverables:**
- `packages/supabase/src/module/` — 4 module pairs + `src/index.ts` + `src/react.ts`
- `apps/web/` — minimal Next.js 15 app, three Supabase clients, API lib helpers, 6 route files
- Workspace wiring (`pnpm-workspace.yaml`, root scripts)

**Verification:** `pnpm typecheck` ✅ · `pnpm test` ✅ (no test files; `passWithNoTests`)

---

### Session 2 — MCP skill workflow clarification

**Date:** 2026-06-24  
**Goal:** Confirm remote MCP skill availability; prefer MCP when possible.

| MCP tool / skill | Used? | Result |
|---|---|---|
| `get_platform_guide` | ✅ | Re-read workflow |
| `skills_search` | ✅ | Empty for app-layer queries (`module hooks`, `feature folder`, etc.) |
| `skill_get("add-module-and-hooks")` | ✅ | **Not found** — server returned available list (4 infra skills only) |
| `skill_get("terraform-quality-gate")` | ✅ | Fetched successfully (verification probe, not applied to Recipe Box work) |
| `get_skills_archive` | ✅ | Archive contains same 4 infra skills; no app-layer skills |

**Outcome:** No remote MCP skill applied to Recipe Box implementation. User directed: try remote MCP first; if unavailable, report explicitly.

---

### Session 3 — Implementation review + this log

**Date:** 2026-06-24  
**Goal:** Review current work; create `agentic_log.md`.

| MCP tool / skill | Used? | Result |
|---|---|---|
| `get_platform_guide` | ✅ | Workflow check |
| `skills_search` | ❌ | Not needed for log/review task |
| `skill_get` | ❌ | No applicable remote skill |

**Deliverables:** This file + review notes below.

---

## Implementation review (current state)

### ✅ Complete vs MINI_PRD §5

| Requirement | Status | Notes |
|---|---|---|
| `GET/POST /api/recipes` | ✅ | List + create |
| `GET/PATCH/DELETE /api/recipes/[id]` | ✅ | Full CRUD |
| `GET/POST /api/tags` | ✅ | List + create only (per PRD) |
| `POST /api/recipes/[id]/tags` | ✅ | Body `{ tagIds: string[] }`; replace-all via `setRecipeTags` |
| `GET /api/plan?weekStart=` | ✅ | Zod-validated query param |
| `POST /api/plan` | ✅ | Upsert on `(owner_id, week_start, day_of_week, slot)` |
| `DELETE /api/plan/[id]` | ✅ | Soft-delete |
| Three Supabase clients | ✅ | `client.ts`, `server.ts`, `admin.ts` |
| `await params` | ✅ | All `[id]` routes |
| `await cookies()` | ✅ | Via `supabaseServerClient()` |
| Zod bodies | ✅ | `lib/api/recipes.ts`, `tags.ts`, `plan.ts` |
| `{ error, detail }` envelope | ✅ | `lib/api/responses.ts` |
| Data-layer module pairs | ✅ | `.ts` + `.react.ts` + barrels |
| `pnpm typecheck` | ✅ | Both packages pass |

### ⚠️ Gaps / follow-ups (MINI_PRD §6–§8)

| Item | Priority | Notes |
|---|---|---|
| Integration test (RLS self-scoping) | High | §7 acceptance criteria — not started (`vitest-integration-author` skill not on remote MCP) |
| Feature folders `/recipes`, `/plan` | High | §6 UI — `feature-folder-scaffold` not on remote MCP |
| `POST /api/plan` status on update | Low | Always returns `201`; could return `200` when updating existing slot |
| Tag ID validation on attach | Medium | `setRecipeTags` does not verify each `tagId` exists / belongs to owner before insert |
| Auth middleware | Medium | No `middleware.ts` for session refresh (may be needed before UI work) |
| `recipe-tags` nested select | Low | `listTagsForRecipe` uses join select; relies on RLS to hide soft-deleted tags |
| Unused tag CRUD in module | Info | `updateTag` / `softDeleteTag` exist in data layer but no API routes (PRD doesn't require them) |

### Data-layer convention check

| Convention | Status |
|---|---|
| Explicit `*_SELECT` (no `select('*')`) | ✅ |
| Dual query-key catalogues | ✅ |
| RO-RO fat-arrow functions | ✅ |
| Soft-delete reads (`is_deleted = false`) | ✅ |
| Junction hard-delete (`recipe_tags`) | ✅ |
| Barrel exports (`index.ts`, `react.ts`) | ✅ |
| `.js` import specifiers in supabase package | ✅ |

---

### Session 4 — UI feature folders (§6)

**Date:** 2026-06-24
**Goal:** Build `/recipes` (list + dialogs + soft-delete), `/recipes/[id]` (read view, tags, ingredients), `/plan` (7-column week grid with upsert + clear), wire to existing TanStack Query hooks.

| MCP tool / skill | Used? | Result |
|---|---|---|
| `get_platform_guide` | ✅ | Workflow read |
| `skills_search("feature folder scaffold UI React Next.js")` | ✅ | **Empty** — no match |
| `skills_search("design lab mockup component")` | ✅ | **Empty** — no match |
| `skills_search("TanStack Query hooks page")` | ✅ | **Empty** — no match |
| `skills_search("week grid plan calendar UI")` | ✅ | **Empty** — no match |
| `skill_get` | ❌ | Not called — no remote skill found |

**No remote MCP skill matched.** All four queries returned empty. Per platform guide rule: reported explicitly, fell back to local skill.

**Fallback guidance used:**
- `Pet project/.claude/skills/feature-folder-scaffold/SKILL.md` — list page shape, dialog wiring, hook import pattern, RO-RO callbacks
- `Pet project/.claude/skills/promote-design-lab-mock/SKILL.md` — read to decide whether `/design-lab` mock was needed (decided: skip — no design-lab infra in test project; conditional per user instruction)
- MINI_PRD.md §6 spec

**Design-lab decision:** User said "Mock it in /design-lab first *if* it needs a visual pass." This test project has no design-lab infrastructure and the layouts (list + CRUD dialogs, week grid) are standard enough to build directly. Skipped mock stage.

**Adaptations from skill (test project ≠ real monorepo):**
- No `useActiveWorkspace()` / no workspace/role concept → replaced with `useUserId()` context
- No shadcn/ui CLI → used plain Tailwind classes on native HTML elements, same structural API
- No `UserProvider` existed → created at `contexts/user-context.tsx`
- Recipes in real app use full-page create flow; MINI_PRD §6 explicitly calls for dialogs → followed MINI_PRD

**Packages added to `apps/web/package.json`:**
- `@tanstack/react-query ^5.62.7` (QueryClientProvider in web layer)
- `react-hook-form ^7.54.0`
- `@hookform/resolvers ^3.9.0`
- `tailwindcss ^3.4.17` + `postcss ^8.4.49` + `autoprefixer ^10.4.20`

**Deliverables:**

```
apps/web/tailwind.config.ts
apps/web/postcss.config.js
apps/web/app/globals.css
apps/web/app/providers.tsx                          — QueryClientProvider
apps/web/app/layout.tsx                             — updated (globals.css + Providers)
apps/web/hooks/use-supabase.ts                      — returns browser SupabaseClient
apps/web/contexts/user-context.tsx                  — UserProvider + useUserId()
apps/web/app/(app)/layout.tsx                       — auth guard + nav + UserProvider
apps/web/app/(app)/recipes/page.tsx                 — list + edit/delete dropdown
apps/web/app/(app)/recipes/_components/recipe-form.tsx
apps/web/app/(app)/recipes/_components/recipe-form-dialog.tsx  — Sheet (right drawer)
apps/web/app/(app)/recipes/_components/delete-recipe-dialog.tsx
apps/web/app/(app)/recipes/[id]/page.tsx            — read view: tags + ingredient lines
apps/web/app/(app)/plan/page.tsx                    — 7-col × 3-slot week grid
```

**Verification:** `pnpm typecheck` ✅

**Note:** `lucide-react` was not in the original web package.json — added alongside the other UI deps and resolved in the same `pnpm install` pass.

---

---

### Session 5 — Integration tests (MINI_PRD §7)

**Date:** 2026-06-24  
**Goal:** Write integration tests proving RLS self-scoping, soft-delete visibility, duplicate-label constraint, and slot-replacement; run `pnpm typecheck && pnpm test`.

| MCP tool / skill | Used? | Result |
|---|---|---|
| `get_platform_guide` | ✅ | Workflow read (mandatory first step) |
| `skills_search("integration test RLS supabase")` | ✅ | **Empty** |
| `skills_search("testing vitest")` | ✅ | **Empty** |
| `skills_search("supabase database")` | ✅ | **Empty** |
| `skills_search("test")` | ✅ | **Empty** |
| `skills_search("recipe")` | ✅ | **Empty** |
| `skills_search("integration")` | ✅ | **Empty** |
| `skills_search("deployment")` | ✅ | `terraform-app-investigation` + `cicd-simple-pipeline-planner` — **not applicable** |
| `skill_get` | ❌ | No matching skill found |

**No remote MCP skill matched.** All integration/test queries returned empty. Only infra-related skills exist on the platform. Per platform guide: reported explicitly, proceeded from codebase patterns.

**Fallback:** MINI_PRD.md §7, migration SQL (RLS policies), existing data-layer modules, `supabase status` for local credentials.

#### Key findings

| Finding | Impact on test design |
|---|---|
| RLS UPDATE policy: `USING (owner_id = auth.uid())` — matches 0 rows silently, no error | Write isolation test verifies original value unchanged rather than expecting an error |
| RLS INSERT policy: `WITH CHECK (owner_id = auth.uid())` | Forged-owner INSERT test expects non-null error |
| `plan_entries.recipe_id` FK has no `ON DELETE CASCADE` | Recipe soft-delete doesn't touch plan_entries → plan entry stays readable |
| Partial unique index on `(owner_id, lower(label)) WHERE is_deleted = FALSE` | Soft-deleting a tag unblocks the same label for reinsertion |
| `upsertPlanEntry` is app-level lookup + update (not DB upsert) | Same `id` is returned on slot-replacement → test asserts `afterId === entryId` |
| `email_confirm: true` in admin.createUser | Avoids depending on `config.toml` `enable_confirmations` value |
| Auth user cascade: `owner_id … ON DELETE CASCADE` on all tables | `afterAll` deletes users → all test rows cleaned automatically |

#### Deliverables

| File | Action |
|---|---|
| `apps/web/tests/integration.test.ts` | Created — 4 describe groups, 8 `it` blocks |
| `apps/web/vitest.config.ts` | Updated — added `testTimeout: 15_000` |

#### Test matrix

| # | Group | What is proven |
|---|---|---|
| 1 | RLS self-scoping | B's `listRecipes` + direct `.maybeSingle()` never return A's row |
| 2 | RLS self-scoping | B's UPDATE leaves A's recipe title untouched |
| 3 | RLS self-scoping | B's forged INSERT (owner_id = A) is rejected with error |
| 4 | Soft-delete visibility | `softDeleteRecipe` removes recipe from `listRecipes` |
| 5 | Soft-delete visibility | Plan-entry for a soft-deleted recipe still appears in `listPlanEntriesForWeek` |
| 6 | Duplicate-label | Second `createTag` with same live label rejects |
| 7 | Duplicate-label | Same label accepted after `softDeleteTag` of original |
| 8 | Slot-replacement | Second `upsertPlanEntry` on same slot returns same id and updates `recipe_id` |

#### Root-cause fix — RLS SELECT policy vs PostgREST 14 soft-delete

**PostgREST version in local Supabase:** 14.10  
**Problem:** PostgREST 12+ changed the default return preference for PATCH from `return=minimal` to `return=representation`. After `softDeleteRecipe`/`softDeleteTag` set `is_deleted = true`, PostgREST evaluated the updated row through the SELECT policy via RETURNING. The SELECT policy `USING (owner_id = auth.uid() AND is_deleted = FALSE)` made the row invisible, and PostgREST 14 raised "new row violates row-level security policy" instead of returning empty.

**Fix:** [packages/supabase/supabase/migrations/20260624180000_fix_rls_select_policies_remove_soft_delete_filter.sql](packages/supabase/supabase/migrations/20260624180000_fix_rls_select_policies_remove_soft_delete_filter.sql) — drops and recreates SELECT policies on `recipes`, `tags`, and `plan_entries` with `USING (owner_id = auth.uid())` only. Soft-delete visibility is already enforced at the application layer in every list/get query (`is_deleted = false` filter in module functions).

Applied with `pnpm db:reset` (all 7 migrations applied clean).

#### Verification

| Command | Result |
|---|---|
| `pnpm typecheck` | ✅ both packages pass |
| `pnpm test` | ✅ 8/8 tests pass (1.04 s) |

---

### Session 6 — PRD drift audit & punch list

**Date:** 2026-06-25
**Goal:** Full review of built output against MINI_PRD; flag every delta and produce a prioritised punch list.

| MCP tool / skill | Used? | Result |
|---|---|---|
| `get_platform_guide` | ✅ | Mandatory first step |
| `skills_search("audit review PRD drift punch list")` | ✅ | **Empty** — no matching skill |
| `skill_get` | ❌ | No applicable remote skill |

**Remote skill applied:** none  
**Fallback:** Full manual audit of migrations, API routes, data-layer modules, UI pages, and integration tests vs. MINI_PRD.

---

#### ✅ Confirmed correct vs PRD

| Area | Finding |
|---|---|
| Schema §4.1–4.3 | All columns, types, PKs, FKs, CHECK constraints, partial unique indexes, soft-delete defaults match the spec |
| `meal_slot` enum | `breakfast \| lunch \| dinner` — correct |
| RLS §4.4 | Owner-scoped policies on all tables; correct hard-delete on `recipe_tags` (no is_deleted column) |
| API surface §5 | All 10 required endpoints present and routed correctly |
| `await params` / `await cookies()` | All `[id]` routes await params; server client awaits cookies ✅ |
| Zod body validation | All POST/PATCH bodies validated; `badRequest` returned on failure ✅ |
| 201 on creation | `POST /api/recipes`, `POST /api/tags`, `POST /api/plan` (create path) ✅ |
| Three Supabase clients | `client.ts`, `server.ts`, `admin.ts` ✅ |
| Data-layer conventions | `*_SELECT` constants, RO-RO fat-arrow, soft-delete filters in module queries, junction hard-delete ✅ |
| Acceptance criteria §7 | RLS self-scoping, soft-delete visibility, duplicate-label, slot-replacement all covered by 8 integration tests ✅ |
| `pnpm typecheck && pnpm test` | Both pass ✅ |
| UI §6 | `/recipes` list+dialogs+delete, `/recipes/[id]` detail+tags+ingredients, `/plan` 7-col×3-slot grid — all present |

---

#### 🔴 HIGH — data correctness bugs

**H1 · Soft-deleted tags visible via join in `listTagsForRecipe`**

- **File:** `packages/supabase/src/module/recipe-tags.ts:43`
- **Root cause:** The Session 5 fix migration (`20260624180000`) removed `AND is_deleted = FALSE` from the `tags` SELECT policy so that PostgREST 14 soft-deletes wouldn't error. But `listTagsForRecipe` does `select('tag_id, tags (id, label, color)')` — a relational join — and never filters `is_deleted` on the joined tags. With the policy fix applied, a soft-deleted tag that still has a `recipe_tags` row will now be returned to the caller.
- **Previous log entry:** was noted as "relies on RLS to hide soft-deleted tags" (Low); the policy fix escalated this to live bug.
- **Impact:** Recipe detail page can show tags the user has already deleted.
- **Fix:** Add `is_deleted` to the join select and filter at the app layer, or split into two queries with an `.eq('is_deleted', false)` on the tags step:
  ```ts
  .select('tag_id, tags(id, label, color, is_deleted)')
  // then in the flatMap, skip rows where t.is_deleted === true
  ```

---

#### 🟡 MEDIUM — spec gaps / bad behaviour

**M1 · Response envelope drift (`{ data }` → resource-specific keys)**

- **MINI_PRD §5 / CLAUDE.md:** "Response envelope: `{ data }` on success, `{ error, detail }` on failure."
- **Actual:** Routes return `{ recipes }`, `{ recipe }`, `{ tags }`, `{ entries }`, bare `{ id }`, `{ ok: true }`.  `jsonOk` in `responses.ts` passes data through unchanged — no `data:` wrapper.
- **Impact:** No user-visible breakage today because the UI calls Supabase directly via hooks, not the REST API. But any external consumer of the API routes gets an inconsistent contract.
- **Fix:** Either update `jsonOk` to wrap: `Response.json({ data })` and update every caller, or formally document the deviation and remove the `{ data }` claim from the spec.

**M2 · `POST /api/plan` always returns 201 even on slot replace**

- **MINI_PRD §5 / CLAUDE.md:** "201 for creation." When `upsertPlanEntry` updates an existing slot, it should return 200.
- **File:** `apps/web/app/api/plan/route.ts:46` — `jsonOk(result, { status: 201 })` always.
- **Fix:** Return `{ id, created: boolean }` from `upsertPlanEntry`, or have the route pass `status: existing ? 200 : 201`.

**M3 · `weekStart` not validated as a Monday**

- **MINI_PRD §4.3:** "`week_start date not null` — Monday of the target week."
- **Files:** `apps/web/lib/api/plan.ts:8` (`weekStartQuerySchema`) and `:15` (`upsertPlanEntryBodySchema`) — both only validate `YYYY-MM-DD` format, not that the date falls on a Monday.
- **Fix:**
  ```ts
  .refine((s) => new Date(s + 'T00:00:00Z').getUTCDay() === 1, 'must be a Monday')
  ```

**M4 · Missing `middleware.ts` for session refresh**

- **Why needed:** Next.js SSR + Supabase SSR requires a `middleware.ts` at the app root to call `supabase.auth.getUser()` and forward refreshed cookies on every request. Without it, the session cookie won't be refreshed mid-session and server components/API routes can get a stale session.
- **Impact:** Auth guard in `app/(app)/layout.tsx` may fail to detect a valid but recently-refreshed session; tokens expire silently.
- **Fix:** Add `apps/web/middleware.ts` using `@supabase/ssr` `createServerClient` + `request/response` cookie handling per Supabase docs.

**M5 · `setRecipeTags` accepts tagIds without owner verification**

- **File:** `packages/supabase/src/module/recipe-tags.ts:55`
- **Risk:** A client could pass UUIDs of tags belonging to another user. RLS on `recipe_tags` INSERT only checks `owner_id = auth.uid()` for the junction row, not that the referenced `tag_id` is owned by the same user. A cross-user FK insert would fail silently if the FK references a row invisible to RLS, but the error surface is unclear.
- **Fix:** Before the `insert`, verify all `tagIds` exist in `tags` for this `ownerId` with a `select('id').in('id', tagIds).eq('owner_id', ownerId)` count check.

---

#### 🔵 LOW — cleanup / cosmetic

**L1 · Duplicate query key exports in data modules**

- **Files:** `packages/supabase/src/module/recipes.ts:22–31` exports both `recipeQueryKeys` and `recipeKeys` with identical shape. Same in `plan-entries.ts` (`planEntryQueryKeys` / `planEntryKeys`). Hooks reference only `recipeKeys` / `planEntryKeys`.
- **Fix:** Delete the unused `*QueryKeys` variants; single export per module.

**L2 · `isToday` highlights Monday even when today is not Monday**

- **File:** `apps/web/app/(app)/plan/page.tsx:213`
- **Code:** `toISODate(date) === toISODate(getMondayOf(new Date()))` — this is true for the Monday column of the current week regardless of today's day.
- **Fix:** Remove the first condition; keep only `toISODate(date) === toISODate(new Date())`.

**L3 · No UI to create tags**

- **MINI_PRD §7 AC:** "Tags can be created and attached/detached."
- `POST /api/tags` exists; `/recipes/[id]` has an "Edit tags" overlay that only shows existing tags. A new user has no way to create tags without a direct API call.
- PRD §6 doesn't specify a `/tags` page, so this is a gap in the §6 UI spec rather than a missing route. Suggest adding a "Create tag" inline action inside the tags editor overlay on `/recipes/[id]`.

---

#### Open items carried forward from previous sessions

| Item | Priority | Status |
|---|---|---|
| H1 — soft-deleted tags visible via join | HIGH | **Fixed in session 7** |
| M1 — response envelope `{ data }` drift | MEDIUM | **Fixed in session 7** |
| M2 — `POST /api/plan` always 201 | MEDIUM | **Fixed in session 7** |
| M3 — `weekStart` not validated as Monday | MEDIUM | **Fixed in session 7** |
| M4 — missing `middleware.ts` | MEDIUM | **Fixed in session 7** |
| M5 — `setRecipeTags` tag ownership | MEDIUM | **Fixed in session 7** |
| L1 — duplicate query key exports | LOW | **Fixed in session 7** |
| L2 — `isToday` plan highlight bug | LOW | **Fixed in session 7** |
| L3 — no tag creation UI | LOW | **Fixed in session 7** |

---

### Session 7 — Fix all punch list items from session 6

**Date:** 2026-06-25
**Goal:** Resolve all 9 open issues (H1, M1–M5, L1–L3) identified in the session 6 audit.

| MCP tool / skill | Used? | Result |
|---|---|---|
| `get_platform_guide` | ✅ | Mandatory first step |
| `skills_search("route handler API response middleware auth supabase")` | ✅ | **Empty** |
| `skills_search("supabase RLS soft-delete module hooks data layer")` | ✅ | **Empty** |
| `skill_get` | ❌ | No applicable remote skill |

**Remote skill applied:** none — all 4 MCP skills are infra-only; none cover app-layer fixes.

#### Changes made

| Fix | File(s) | Change |
|---|---|---|
| H1 — soft-deleted tags in join | `packages/supabase/src/module/recipe-tags.ts` | `listTagsForRecipe` rewritten as two-step query; fetches tag IDs then re-queries `tags` with `is_deleted = false` |
| M1 — response envelope | All 6 route files under `apps/web/app/api/` | All `jsonOk(...)` calls wrapped: `jsonOk({ data: ... })` |
| M2 — plan POST status | `packages/supabase/src/module/plan-entries.ts`, `apps/web/app/api/plan/route.ts` | `upsertPlanEntry` returns `{ id, created: boolean }`; route returns 201 on create, 200 on replace |
| M3 — weekStart Monday | `apps/web/lib/api/plan.ts` | Both `weekStartQuerySchema` and `upsertPlanEntryBodySchema` now refine for Monday (`getUTCDay() === 1`) |
| M4 — middleware | `apps/web/middleware.ts` (new) | `createServerClient` with request/response cookie pattern; calls `getUser()` on every request |
| M5 — tag ownership | `packages/supabase/src/module/recipe-tags.ts` | `setRecipeTags` verifies all provided tagIds belong to the calling owner before delete+insert |
| L1 — duplicate keys | `recipes.ts`, `plan-entries.ts`, `tags.ts` (all in supabase module) | Removed unused `recipeQueryKeys`, `planEntryQueryKeys`, `tagQueryKeys` exports |
| L2 — isToday bug | `apps/web/app/(app)/plan/page.tsx` | Removed erroneous first condition; only `toISODate(date) === toISODate(new Date())` |
| L3 — tag creation UI | `apps/web/app/(app)/recipes/[id]/page.tsx` | Added `useCreateTag` + inline "Create a new tag" form inside the tags editor overlay; new tag is auto-selected on creation |

#### Verification

| Command | Result |
|---|---|
| `pnpm typecheck` | ✅ both packages pass |
| `pnpm test` | ✅ 8/8 tests pass (33.5 s) |

---

## Template for future sessions

```markdown
### Session N — <short title>

**Date:** YYYY-MM-DD
**Goal:** <one line>

| MCP tool / skill | Used? | Result |
|---|---|---|
| `get_platform_guide` | ✅/❌ | |
| `skills_search("<query>")` | ✅/❌ | |
| `skill_get("<id>")` | ✅/❌ | |
| `skill_file_get("<id>", "<path>")` | ✅/❌ | |
| `get_skills_archive` | ✅/❌ | |

**Remote skill applied:** <skill_id or "none">
**Fallback:** <local skill / MINI_PRD / user direction>
**Deliverables:** <files or features touched>
**Verification:** <commands run + result>
```
