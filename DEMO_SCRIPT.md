# Demo Recording Script — Weekly Food Planner (Recipe Box)

> **Format:** step-by-step walkthrough. Each block shows what to do, what you'll see, and
> optional narrator notes if you're adding voiceover. Total runtime ≈ 3–4 minutes.
>
> **Before you start:**
> - Run `pnpm --filter @recipe-box/supabase db:start` and `pnpm db:reset`
> - Run `pnpm --filter @recipe-box/web dev` and open `http://localhost:3000`
> - Use a clean browser profile (no extensions, no autofill noise)
> - Set browser zoom to 100%, window to ~1280 × 800

---

## Scene 1 — Sign in

**Do:** Land on the home/auth page. Sign in with a demo account.

**You'll see:** After sign in, the app redirects to `/recipes` showing the empty state card
("No recipes yet. Add your first recipe.").

> *Voiceover:* "This is Recipe Box — a personal recipe library with a weekly meal planner,
> built on Next.js 15 and Supabase."

---

## Scene 2 — Create the first recipe

**Do:** Click **"New recipe"** (top-right button) or the "Add your first recipe" button inside the card.

**You'll see:** The *Create recipe* dialog slides in with three fields — Title, Notes, Ingredients.

**Fill in:**
- **Title:** `Pasta Carbonara`
- **Notes:** `Classic Roman. Use guanciale if you can find it — pancetta works too.`
- **Ingredients:** Click **"Add ingredient"** three times and type:
  - `200g spaghetti`
  - `100g guanciale`
  - `2 egg yolks`

**Do:** Click **"Save recipe"**.

**You'll see:** The dialog closes. The recipes table now shows one row — "Pasta Carbonara" with "3 ingredients".

> *Voiceover:* "Recipes have a title, free-text notes, and a dynamic ingredient list."

---

## Scene 3 — Create two more recipes

**Do:** Repeat the same flow twice for:

**Recipe 2:**
- **Title:** `Greek Salad`
- **Notes:** `No lettuce — just tomato, cucumber, olives, feta, and good olive oil.`
- **Ingredients:** `2 tomatoes`, `1 cucumber`, `100g feta`

**Recipe 3:**
- **Title:** `Avocado Toast`
- **Notes:** (leave blank)
- **Ingredients:** `2 slices sourdough`, `1 avocado`, `lemon juice`

**You'll see:** Three rows in the recipes table. The ingredient count column updates for each.

---

## Scene 4 — View a recipe detail and add tags

**Do:** Click on **"Pasta Carbonara"** in the table to open the detail page (`/recipes/[id]`).

**You'll see:** Detail page with title, an empty Tags section, the Notes card, and the
ingredient list.

**Do:** Click **"Add tags"** next to the Tags section header.

**You'll see:** The tags editor overlay opens. The top half is empty (no tags exist yet).
At the bottom there's a "Create a new tag" input.

**Create two tags:**
1. Type `quick` → click **"Add"** — the tag appears as a blue pill in the selector (already selected).
2. Type `italian` → click **"Add"** — same.

**Do:** Click **"Save tags"**.

**You'll see:** The overlay closes. The detail page now shows `quick` and `italian` as colored
pill badges under the Tags section.

> *Voiceover:* "Tags can be created on the fly and attached to any recipe. They carry an
> optional color and are scoped per user."

---

## Scene 5 — Attach an existing tag to another recipe

**Do:** Click the **← Recipes** back link to return to the list. Click on **"Greek Salad"**.

**Do:** Click **"Add tags"**.

**You'll see:** The tags editor now shows `quick` and `italian` as selectable pills (unselected).

**Do:** Click **"quick"** to select it.

**Do:** Click **"Save tags"**.

**You'll see:** "Greek Salad" now shows the `quick` tag badge on its detail page.

---

## Scene 6 — Edit a recipe

**Do:** Still on the Greek Salad detail page, click the **"Edit"** button (top-right, pencil icon).

**You'll see:** The edit dialog opens pre-filled with the current values.

**Do:** Add one more ingredient — click **"Add ingredient"** and type `50ml olive oil`.

**Do:** Click **"Save recipe"**.

**You'll see:** The dialog closes. The ingredient count in the Notes/detail area now shows 4.

---

## Scene 7 — Go to the Week Plan

**Do:** Navigate to `/plan` via the sidebar or top navigation.

**You'll see:** A 7-column week grid (Mon–Sun) with three rows (Breakfast, Lunch, Dinner).
Today's column header is highlighted in blue. All cells show "+ add" with a dashed border.
The current week date range is shown in the header (e.g. "Jun 23 – Jun 29, 2026").

> *Voiceover:* "The plan page shows a weekly grid. Click any empty cell to place a recipe
> on that slot."

---

## Scene 8 — Fill the plan

**Do:** Click the **Breakfast** cell under **Monday**.

**You'll see:** The recipe picker overlay opens, listing all three recipes.

**Do:** Click **"Avocado Toast"**.

**You'll see:** The overlay closes. Monday's Breakfast cell is now filled in blue with
"Avocado Toast". Hovering it shows an × icon.

**Do:** Click the **Lunch** cell under **Wednesday**.

**Do:** Select **"Greek Salad"** from the picker.

**Do:** Click the **Dinner** cell under **Wednesday**.

**Do:** Select **"Pasta Carbonara"** from the picker.

**You'll see:** Wednesday now has two filled cells side by side (Lunch + Dinner).

> *Voiceover:* "Each slot is unique per day — placing a recipe on an occupied slot replaces it."

---

## Scene 9 — Replace a slot

**Do:** Click the **Dinner** cell on Wednesday (the blue "Pasta Carbonara" pill).

**You'll see:** The cell clears immediately (optimistic update — the pill disappears).

**Do:** Click the now-empty Dinner cell on Wednesday again.

**Do:** Select **"Avocado Toast"** from the picker.

**You'll see:** Dinner Wednesday is now "Avocado Toast" instead of "Pasta Carbonara".

> *Voiceover:* "Clicking a filled cell removes it — click again to replace it with
> something else."

---

## Scene 10 — Navigate between weeks

**Do:** Click the **›** arrow button in the top-right of the plan header to advance one week.

**You'll see:** The date range label updates to the next week. The grid is empty.

**Do:** Click **"Today"** (the ghost button next to the arrows).

**You'll see:** The grid snaps back to the current week, with the entries still in place.

---

## Scene 11 — Soft-delete a recipe

**Do:** Navigate back to `/recipes`. Click the **⋯** menu on **"Avocado Toast"**.

**You'll see:** A small dropdown with "Edit" and "Delete" options.

**Do:** Click **"Delete"**.

**You'll see:** A confirmation dialog — "Delete Avocado Toast? This action cannot be undone."

**Do:** Confirm the deletion.

**You'll see:** The row disappears from the list. The remaining two recipes are still shown.

**Do:** Navigate back to `/plan`.

**You'll see:** Monday Breakfast and Wednesday Dinner — both previously "Avocado Toast" — now
show a fallback ("…") or an empty state, since the recipe is soft-deleted.
The plan entry itself still exists in the database but the recipe is no longer shown.

> *Voiceover:* "Recipes are soft-deleted — they disappear from the library but the plan
> history is preserved."

---

## Wrap-up shot

**Do:** Navigate to `/plan`, zoom out slightly so the full week grid is visible. Pause for
2 seconds.

**Do:** Navigate back to `/recipes` to show the clean two-recipe list as the final frame.

---

## Sample data cheat sheet

Use this for a consistent, reproducible recording:

| Recipe | Notes | Ingredients |
|---|---|---|
| Pasta Carbonara | Classic Roman. Use guanciale if you can find it — pancetta works too. | 200g spaghetti, 100g guanciale, 2 egg yolks |
| Greek Salad | No lettuce — just tomato, cucumber, olives, feta, and good olive oil. | 2 tomatoes, 1 cucumber, 100g feta, 50ml olive oil |
| Avocado Toast | (none) | 2 slices sourdough, 1 avocado, lemon juice |

| Tag | Attached to |
|---|---|
| quick | Pasta Carbonara, Greek Salad |
| italian | Pasta Carbonara |

| Plan slot | Recipe |
|---|---|
| Monday Breakfast | Avocado Toast |
| Wednesday Lunch | Greek Salad |
| Wednesday Dinner | Avocado Toast (replaced from Pasta Carbonara in Scene 9) |
