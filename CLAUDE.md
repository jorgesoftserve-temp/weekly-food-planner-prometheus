# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MCP Platform (Deployment / Prometheus)

This repo was built using **Deployment MCP** (legacy name: Prometheus). The `.mcp.json` file connects to this MCP server. Before any implementation work, call `get_platform_guide()`, then use `skills_search()` to find the correct skill. Never generate code without first fetching a skill via `skill_get()`.

## Commands

All commands are run from the repo root unless noted.

```bash
# Development
pnpm --filter @recipe-box/web dev          # Next.js dev server (apps/web/)

# Type checking
pnpm typecheck                             # All packages

# Tests
pnpm test                                  # Vitest (apps/web/)

# Database (local Supabase)
pnpm db:reset                              # Reset + re-seed
pnpm db:gen:types                          # Regenerate types from local schema
pnpm --filter @recipe-box/supabase db:start   # Start local Supabase
pnpm --filter @recipe-box/supabase db:migration:new -- <name>  # New migration

# Build
pnpm --filter @recipe-box/web build
```

## Architecture

**Monorepo layout (PNPM workspace):**
- `apps/web/` — Next.js 15 App Router frontend + API routes
- `packages/supabase/` — data layer, DB migrations, RLS policies, generated types

The web app depends on the supabase package via `workspace:*`.

### Data layer (`packages/supabase/src/`)

Modules follow a strict two-file convention:
- `module/{entity}.ts` — plain data functions (imported server-side or in server components)
- `module/{entity}.react.ts` — React Query hooks wrapping those functions

Barrel exports: `src/index.ts` (data functions) and `src/react.ts` (hooks). Import as:
```ts
import { listRecipes } from '@recipe-box/supabase'
import { useRecipesList } from '@recipe-box/supabase/react'
```

Key conventions enforced throughout:
- Explicit `*_SELECT` constants — never `select('*')`
- Soft-delete reads always filter `is_deleted = false`; junction tables (`recipe_tags`) use hard-delete
- React Query keys are defined as catalogues scoped by `ownerId`
- RO-RO pattern: fat-arrow functions, options object in / value out

### API routes (`apps/web/app/api/`)

- Collection routes: `route.ts` (GET list, POST create)
- Detail routes: `[id]/route.ts` (GET, PATCH, DELETE)
- Every handler calls `getAuthenticatedUser()` and returns 401 if unauthenticated
- Request bodies validated with Zod before any DB call
- Response envelope: `{ data }` on success, `{ error, detail }` on failure
- HTTP status: 201 for creation, 400 validation, 401 auth, 500 server error

### Supabase clients

Three clients, each for a specific context (`apps/web/lib/supabase/`):
- `supabaseClient()` — browser (client components)
- `supabaseServerClient()` — SSR / server components (awaits `cookies()`)
- `supabaseAdminClient()` — elevated access (service role)

### Database

Migrations live in `packages/supabase/supabase/migrations/`. Four tables: `recipes`, `tags`, `recipe_tags`, `plan_entries`. All user-owned tables have RLS policies scoped to `auth.uid()`. Generated TypeScript types land in `packages/supabase/src/database.types.ts` — regenerate after schema changes with `pnpm db:gen:types`.

### TypeScript

`tsconfig.base.json` enables strict mode, `noUncheckedIndexedAccess`, and `NodeNext` module resolution. The web app adds the Next.js plugin and the path alias `@/*` → `./`.
