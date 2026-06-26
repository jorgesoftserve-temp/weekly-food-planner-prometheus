/**
 * Playwright demo recording script for Recipe Box.
 *
 * Prerequisites:
 *   1. `pnpm --filter @recipe-box/supabase db:start`  (local Supabase running)
 *   2. `pnpm db:reset`                                 (clean DB)
 *   3. `pnpm --filter @recipe-box/web dev`             (Next.js running on :3000)
 *   4. `node scripts/record-demo.mjs`                  (this script)
 *
 * Output: demo-recording/<timestamp>.webm
 */

import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'

// ─── Configuration ────────────────────────────────────────────────────────────
// Override any of these with environment variables.

const NEXT_URL       = process.env.NEXT_URL                  ?? 'http://localhost:3000'
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'http://127.0.0.1:54421'

// Standard local Supabase JWT keys — the same for every local project.
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.OVNG5wLCEG1-YmP-k6xhbkLpBHFSVoHfZo9-4M3tZ54'

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SJBo'

const DEMO_EMAIL    = 'demo@recipe-box.local'
const DEMO_PASSWORD = 'DemoPass9!rBx'
const OUTPUT_DIR    = 'demo-recording'

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function ensureTestUser() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true }),
  })
  // 422 = user already exists — that's fine
  if (!res.ok && res.status !== 422) {
    throw new Error(`Could not create demo user: ${await res.text()}`)
  }
}

async function signIn() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Sign-in failed: ${await res.text()}`)
  return res.json() // { access_token, refresh_token, expires_in, token_type, user }
}

/**
 * @supabase/ssr stores the session as one or more cookies named
 * `sb-<hostname>-auth-token[.<chunk>]`, chunked at 3 180 chars.
 * We replicate that format so the server client can read the session.
 */
function buildAuthCookies(session, domain) {
  const hostname  = new URL(SUPABASE_URL).hostname          // e.g. 127.0.0.1
  const cookieKey = `sb-${hostname}-auth-token`
  const value     = JSON.stringify(session)
  const CHUNK     = 3180
  const base      = { domain, path: '/', secure: false, httpOnly: false, sameSite: 'Lax' }

  if (value.length <= CHUNK) {
    return [{ name: cookieKey, value, ...base }]
  }

  const cookies = []
  for (let i = 0; i * CHUNK < value.length; i++) {
    cookies.push({
      name: `${cookieKey}.${i}`,
      value: value.slice(i * CHUNK, (i + 1) * CHUNK),
      ...base,
    })
  }
  return cookies
}

// ─── Page helpers ─────────────────────────────────────────────────────────────

/** Returns the <td> for a given meal slot row and day index (0 = Monday). */
function planCell(page, slot, dayIndex) {
  // Plan table structure: <tr> with label td + 7 day tds.
  // dayIndex + 1 skips the label column (nth() is 0-indexed).
  return page
    .locator('tbody tr')
    .filter({ hasText: new RegExp(`^${slot}$`, 'i') })
    .locator('td')
    .nth(dayIndex + 1)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  // ── Auth setup ──────────────────────────────────────────────────────────────
  console.log('► Creating / verifying demo user…')
  await ensureTestUser()

  console.log('► Signing in…')
  const session = await signIn()

  const nextHost    = new URL(NEXT_URL).hostname // 'localhost'
  const authCookies = buildAuthCookies(session, nextHost)

  // ── Browser launch ──────────────────────────────────────────────────────────
  const browser = await chromium.launch({ headless: false, slowMo: 550 })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1280, height: 800 } },
  })

  await context.addCookies(authCookies)
  const page = await context.newPage()

  try {
    // ── Scene 1: Land on /recipes (empty state) ───────────────────────────────
    console.log('Scene 1 — Recipes empty state')
    await page.goto(`${NEXT_URL}/recipes`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1800)

    // ── Scene 2: Create "Pasta Carbonara" ─────────────────────────────────────
    console.log('Scene 2 — Create Pasta Carbonara')
    await page.click('button:has-text("New recipe")')
    await page.waitForSelector('#recipe-title')

    await page.fill('#recipe-title', 'Pasta Carbonara')
    await page.fill('#recipe-notes', 'Classic Roman. Use guanciale if you can find it — pancetta works too.')

    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 1"]', '200g spaghetti')
    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 2"]', '100g guanciale')
    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 3"]', '2 egg yolks')

    await page.click('button:has-text("Save recipe")')
    await page.waitForSelector('text=Pasta Carbonara')
    await page.waitForTimeout(800)

    // ── Scene 3a: Create "Greek Salad" ────────────────────────────────────────
    console.log('Scene 3 — Create Greek Salad')
    await page.click('button:has-text("New recipe")')
    await page.waitForSelector('#recipe-title')

    await page.fill('#recipe-title', 'Greek Salad')
    await page.fill('#recipe-notes', 'No lettuce — just tomato, cucumber, olives, feta, and good olive oil.')

    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 1"]', '2 tomatoes')
    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 2"]', '1 cucumber')
    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 3"]', '100g feta')

    await page.click('button:has-text("Save recipe")')
    await page.waitForSelector('text=Greek Salad')
    await page.waitForTimeout(500)

    // ── Scene 3b: Create "Avocado Toast" ──────────────────────────────────────
    console.log('Scene 3 — Create Avocado Toast')
    await page.click('button:has-text("New recipe")')
    await page.waitForSelector('#recipe-title')

    await page.fill('#recipe-title', 'Avocado Toast')

    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 1"]', '2 slices sourdough')
    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 2"]', '1 avocado')
    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 3"]', 'lemon juice')

    await page.click('button:has-text("Save recipe")')
    await page.waitForSelector('text=Avocado Toast')
    await page.waitForTimeout(1000)

    // ── Scene 4: Pasta Carbonara detail — create & attach tags ────────────────
    console.log('Scene 4 — Tags on Pasta Carbonara')
    await page.click('a:has-text("Pasta Carbonara")')
    await page.waitForURL(`${NEXT_URL}/recipes/**`)
    await page.waitForTimeout(600)

    await page.click('text=Add tags')
    const tagsDialog = page.locator('[aria-labelledby="tags-editor-title"]')
    await tagsDialog.waitFor()

    await tagsDialog.locator('input[placeholder="Tag label"]').fill('quick')
    await tagsDialog.locator('button:has-text("Add")').click()
    await page.waitForTimeout(400)

    await tagsDialog.locator('input[placeholder="Tag label"]').fill('italian')
    await tagsDialog.locator('button:has-text("Add")').click()
    await page.waitForTimeout(400)

    await tagsDialog.locator('button:has-text("Save tags")').click()
    await tagsDialog.waitFor({ state: 'detached' })
    await page.waitForTimeout(800)

    // ── Scene 5: Greek Salad — attach existing "quick" tag ────────────────────
    console.log('Scene 5 — quick tag on Greek Salad')
    await page.goto(`${NEXT_URL}/recipes`, { waitUntil: 'networkidle' })
    await page.click('a:has-text("Greek Salad")')
    await page.waitForURL(`${NEXT_URL}/recipes/**`)
    await page.waitForTimeout(500)

    await page.click('text=Add tags')
    const tagsDialog2 = page.locator('[aria-labelledby="tags-editor-title"]')
    await tagsDialog2.waitFor()
    await tagsDialog2.locator('button:has-text("quick")').click()
    await page.waitForTimeout(300)
    await tagsDialog2.locator('button:has-text("Save tags")').click()
    await tagsDialog2.waitFor({ state: 'detached' })
    await page.waitForTimeout(800)

    // ── Scene 6: Edit Greek Salad — add an ingredient ─────────────────────────
    console.log('Scene 6 — Edit Greek Salad')
    await page.click('button:has-text("Edit")')
    await page.waitForSelector('#recipe-title')

    await page.click('button:has-text("Add ingredient")')
    await page.fill('input[placeholder="Ingredient 4"]', '50ml olive oil')
    await page.click('button:has-text("Save recipe")')
    await page.waitForTimeout(800)

    // ── Scene 7: Navigate to the week plan ────────────────────────────────────
    console.log('Scene 7 — Week plan')
    await page.goto(`${NEXT_URL}/plan`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)

    // ── Scene 8: Fill Monday Breakfast, Wednesday Lunch & Dinner ─────────────
    console.log('Scene 8 — Fill plan slots')

    await planCell(page, 'breakfast', 0).locator('button:has-text("+ add")').click()
    await page.waitForSelector('text=Pick a recipe')
    await page.click('button:has-text("Avocado Toast")')
    await page.waitForTimeout(600)

    await planCell(page, 'lunch', 2).locator('button:has-text("+ add")').click()
    await page.waitForSelector('text=Pick a recipe')
    await page.click('button:has-text("Greek Salad")')
    await page.waitForTimeout(600)

    await planCell(page, 'dinner', 2).locator('button:has-text("+ add")').click()
    await page.waitForSelector('text=Pick a recipe')
    await page.click('button:has-text("Pasta Carbonara")')
    await page.waitForTimeout(1000)

    // ── Scene 9: Clear Wednesday Dinner and replace ────────────────────────────
    console.log('Scene 9 — Replace Wednesday Dinner')
    await planCell(page, 'dinner', 2).locator('button:has-text("Pasta Carbonara")').click()
    await page.waitForTimeout(700)

    await planCell(page, 'dinner', 2).locator('button:has-text("+ add")').click()
    await page.waitForSelector('text=Pick a recipe')
    await page.click('button:has-text("Avocado Toast")')
    await page.waitForTimeout(1000)

    // ── Scene 10: Navigate weeks ──────────────────────────────────────────────
    console.log('Scene 10 — Navigate weeks')
    await page.click('button[aria-label="Next week"]')
    await page.waitForTimeout(1200)
    await page.click('button:has-text("Today")')
    await page.waitForTimeout(1000)

    // ── Scene 11: Soft-delete Avocado Toast ───────────────────────────────────
    console.log('Scene 11 — Soft-delete Avocado Toast')
    await page.goto(`${NEXT_URL}/recipes`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    const avocadoRow = page.locator('tr').filter({ hasText: 'Avocado Toast' })
    await avocadoRow.locator('button[aria-label="Recipe actions"]').click()
    await page.waitForTimeout(300)
    // "Delete" is the only red action in the dropdown at this point
    await avocadoRow.locator('button:has-text("Delete")').click()

    await page.waitForSelector('[role="alertdialog"]')
    await page.waitForTimeout(400)
    await page.locator('[role="alertdialog"] button:has-text("Delete")').click()
    await page.waitForSelector('text=Avocado Toast', { state: 'detached' })
    await page.waitForTimeout(600)

    // Show plan with deleted recipe's slots now empty
    await page.goto(`${NEXT_URL}/plan`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // ── Wrap-up: back to the clean recipe list ────────────────────────────────
    console.log('Wrap-up — recipe list')
    await page.goto(`${NEXT_URL}/recipes`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

  } finally {
    await context.close() // triggers video save
    await browser.close()
  }

  console.log(`\n✓  Recording saved to ${OUTPUT_DIR}/`)
  console.log('   Open the .webm file in any modern browser or video editor.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
