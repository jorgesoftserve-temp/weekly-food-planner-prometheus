# Weekly Food Planner — Recipe Box

A single-user web app for storing recipes and planning meals across a weekly grid. Built as a full-stack exercise covering auth, schema + RLS, data modules, REST API routes, and UI — all on a minimal but realistic surface.

## Stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Data fetching:** TanStack Query
- **Forms:** react-hook-form + Zod
- **Backend:** Supabase (Auth, Postgres, Row Level Security)
- **Package manager:** pnpm workspaces (Node ≥ 20)

## Monorepo layout

```
apps/web/          # Next.js 15 app (frontend + API routes)
packages/supabase/ # Data layer, DB migrations, RLS policies, generated types
```

## Features

- **Recipe library** — create, edit, and soft-delete recipes with title, notes, free-text ingredient lines, and tags
- **Tags** — create and attach/detach tags (label + optional color) per recipe
- **Weekly plan** — 7-column week grid; place a recipe on any day/slot (breakfast, lunch, dinner); replacing a slot updates it in place

## Getting started

### Prerequisites

- Node ≥ 20
- pnpm 9.x (`npm i -g pnpm@9`)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for local Supabase)

### Install dependencies

```bash
pnpm install
```

### Start local Supabase

```bash
pnpm --filter @recipe-box/supabase db:start
```

### Apply migrations and seed

```bash
pnpm db:reset
```

### Run the dev server

```bash
pnpm --filter @recipe-box/web dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
|---|---|
| `pnpm --filter @recipe-box/web dev` | Start Next.js dev server |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run Vitest integration tests |
| `pnpm db:reset` | Reset and re-seed local DB |
| `pnpm db:gen:types` | Regenerate TypeScript types from local schema |
| `pnpm --filter @recipe-box/supabase db:migration:new -- <name>` | Create a new migration |

## API routes

| Method + Path | Purpose |
|---|---|
| `GET /api/recipes` | List current user's recipes |
| `POST /api/recipes` | Create a recipe |
| `GET /api/recipes/[id]` | Fetch one recipe |
| `PATCH /api/recipes/[id]` | Update title / notes / ingredients |
| `DELETE /api/recipes/[id]` | Soft-delete a recipe |
| `GET /api/tags` | List tags |
| `POST /api/tags` | Create a tag |
| `POST /api/recipes/[id]/tags` | Attach / detach tags |
| `GET /api/plan?weekStart=YYYY-MM-DD` | Get plan entries for a week |
| `POST /api/plan` | Place a recipe on a slot |
| `DELETE /api/plan/[id]` | Remove a plan entry |

## Data model

Four tables — `recipes`, `tags`, `recipe_tags` (junction), `plan_entries`. All user-owned tables have RLS policies scoped to `auth.uid()`, soft-delete via `is_deleted`, and an `updated_at` trigger. See [`MINI_PRD.md`](./MINI_PRD.md) for the full schema spec.

## Project conventions

See [`CLAUDE.md`](./CLAUDE.md) for the full coding conventions:

- Three Supabase clients: browser, SSR, admin
- Explicit `*_SELECT` constants — never `select('*')`
- RO-RO pattern, fat-arrow functions, one export per file, kebab-case filenames
- React Query keys scoped per `ownerId`
- API response envelope: `{ data }` on success, `{ error, detail }` on failure
