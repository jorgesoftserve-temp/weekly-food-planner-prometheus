/**
 * Playwright e2e audit for Recipe Box.
 *
 * Usage:
 *   pnpm e2e    (node --env-file=apps/web/.env.local scripts/audit.mjs)
 *
 * Prerequisites: local Supabase running + Next.js dev server on :3000.
 */

import { chromium } from 'playwright'

// ─── Config ──────────────────────────────────────────────────────────────────

const NEXT_URL         = process.env.NEXT_URL                  ?? 'http://localhost:3000'
const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'http://127.0.0.1:54421'
const ANON_KEY         = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars — run with --env-file=apps/web/.env.local')
  process.exit(1)
}

const DEMO_EMAIL    = 'audit@recipe-box.local'
const DEMO_PASSWORD = 'AuditPass9!rBx'
// Use a timestamp suffix so repeated runs don't collide on unique constraints
const RUN_SUFFIX    = Date.now().toString(36).slice(-4)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const results = []

function pass(label) {
  results.push({ ok: true, label })
  console.log(`  ✓  ${label}`)
}

function fail(label, detail) {
  results.push({ ok: false, label, detail })
  console.error(`  ✗  ${label}`)
  if (detail) console.error(`     ${String(detail).split('\n')[0]}`)
}

async function check(label, fn) {
  try {
    await fn()
    pass(label)
  } catch (err) {
    fail(label, err?.message ?? String(err))
  }
}

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
  if (!res.ok && res.status !== 422) {
    throw new Error(`Could not create audit user: ${await res.text()}`)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Recipe Box — Playwright Audit ===\n')

  console.log('Setting up audit user…')
  await ensureTestUser()

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page    = await context.newPage()

  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('pageerror', err => consoleErrors.push(err.message))

  try {
    // ── [1] Login page (unauthenticated) ────────────────────────────────────
    console.log('\n[1] Login page')

    await check('Login page renders (not blank)', async () => {
      await page.goto(NEXT_URL, { waitUntil: 'networkidle' })
      await page.waitForSelector('input[type="email"]', { timeout: 5000 })
    })

    await check('Sign-in form has email + password + submit', async () => {
      await page.waitForSelector('input[type="email"]')
      await page.waitForSelector('input[type="password"]')
      await page.waitForSelector('button[type="submit"]')
    })

    await check('Wrong password shows inline error', async () => {
      await page.fill('input[type="email"]', DEMO_EMAIL)
      await page.fill('input[type="password"]', 'wrongpassword!')
      await page.click('button[type="submit"]')
      await page.waitForSelector('.text-red-600', { timeout: 8000 })
    })

    await check('Correct credentials redirect to /recipes', async () => {
      await page.fill('input[type="password"]', DEMO_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL(`${NEXT_URL}/recipes`, { timeout: 15000 })
    })

    // ── [2] Authenticated root redirect ─────────────────────────────────────
    console.log('\n[2] Auth redirect')

    await check('Authenticated visit to / redirects to /recipes', async () => {
      await page.goto(NEXT_URL, { waitUntil: 'networkidle' })
      await page.waitForURL(`${NEXT_URL}/recipes`, { timeout: 8000 })
    })

    // ── [3] Recipes list ─────────────────────────────────────────────────────
    console.log('\n[3] Recipes list')

    await check('/recipes page loads with heading', async () => {
      await page.goto(`${NEXT_URL}/recipes`, { waitUntil: 'networkidle' })
      await page.waitForSelector('h1:has-text("Recipes")', { timeout: 5000 })
    })

    await check('Nav shows Recipes and Plan links', async () => {
      await page.waitForSelector('a[href="/recipes"]')
      await page.waitForSelector('a[href="/plan"]')
    })

    await check('Nav shows Sign out button', async () => {
      await page.waitForSelector('button:has-text("Sign out")')
    })

    await check('"New recipe" button is visible', async () => {
      await page.waitForSelector('button:has-text("New recipe")', { timeout: 3000 })
    })

    // ── [4] Create a recipe ──────────────────────────────────────────────────
    console.log('\n[4] Create recipe')

    await check('Opens new recipe dialog', async () => {
      await page.click('button:has-text("New recipe")')
      await page.waitForSelector('#recipe-title', { timeout: 5000 })
    })

    await check('Fills and saves a recipe', async () => {
      await page.fill('#recipe-title', `Audit-${RUN_SUFFIX}`)
      await page.fill('#recipe-notes', 'Created by automated audit.')
      await page.click('button:has-text("Add ingredient")')
      await page.fill('input[placeholder="Ingredient 1"]', '1 cup flour')
      await page.click('button:has-text("Save recipe")')
      await page.waitForSelector(`a:has-text("Audit-${RUN_SUFFIX}")`, { timeout: 8000 })
    })

    // ── [5] Recipe detail ─────────────────────────────────────────────────────
    console.log('\n[5] Recipe detail')

    await check('Recipe detail page loads', async () => {
      await page.click(`a:has-text("Audit-${RUN_SUFFIX}")`)
      await page.waitForURL(`${NEXT_URL}/recipes/**`, { timeout: 5000 })
      await page.waitForSelector(`h1:has-text("Audit-${RUN_SUFFIX}")`, { timeout: 5000 })
    })

    await check('Ingredient is shown', async () => {
      await page.waitForSelector('text=1 cup flour', { timeout: 3000 })
    })

    await check('"Edit" button is present', async () => {
      await page.waitForSelector('button:has-text("Edit")', { timeout: 3000 })
    })

    await check('"Add tags" link is present', async () => {
      await page.waitForSelector('button:has-text("Add tags")', { timeout: 3000 })
    })

    // ── [6] Edit recipe ───────────────────────────────────────────────────────
    console.log('\n[6] Edit recipe')

    await check('Opens edit dialog', async () => {
      await page.click('button:has-text("Edit")')
      await page.waitForSelector('#recipe-title', { timeout: 5000 })
    })

    await check('Updates title and saves', async () => {
      await page.fill('#recipe-title', `Audit-${RUN_SUFFIX} (edited)`)
      await page.click('button:has-text("Save recipe")')
      await page.waitForSelector(`h1:has-text("Audit-${RUN_SUFFIX} (edited)")`, { timeout: 8000 })
    })

    // ── [7] Tags ──────────────────────────────────────────────────────────────
    console.log('\n[7] Tags')

    await check('Tags dialog opens', async () => {
      await page.click('button:has-text("Add tags")')
      await page.waitForSelector('[aria-labelledby="tags-editor-title"]', { timeout: 5000 })
    })

    await check('Can create a new tag', async () => {
      const dialog = page.locator('[aria-labelledby="tags-editor-title"]')
      await dialog.locator('input[placeholder="Tag label"]').fill(`audit-tag-${RUN_SUFFIX}`)
      await dialog.locator('button:has-text("Add")').click()
      await dialog.locator(`button:has-text("audit-tag-${RUN_SUFFIX}")`).waitFor({ timeout: 8000 })
    })

    await check('Can save tags', async () => {
      const dialog = page.locator('[aria-labelledby="tags-editor-title"]')
      await dialog.locator('button:has-text("Save tags")').click()
      await dialog.waitFor({ state: 'detached', timeout: 5000 })
    })

    // ── [8] Plan page ─────────────────────────────────────────────────────────
    console.log('\n[8] Plan page')

    await check('/plan page loads with table', async () => {
      await page.goto(`${NEXT_URL}/plan`, { waitUntil: 'networkidle' })
      await page.waitForSelector('table', { timeout: 8000 })
    })

    await check('"Next week" and "Previous week" buttons exist', async () => {
      await page.waitForSelector('button[aria-label="Next week"]', { timeout: 3000 })
      await page.waitForSelector('button[aria-label="Previous week"]', { timeout: 3000 })
    })

    await check('"Today" button exists', async () => {
      await page.waitForSelector('button:has-text("Today")', { timeout: 3000 })
    })

    await check('Plan grid has breakfast / lunch / dinner rows', async () => {
      const rows = await page.locator('tbody tr').count()
      if (rows !== 3) throw new Error(`Expected 3 rows, got ${rows}`)
    })

    // ── [9] Add entry to plan ─────────────────────────────────────────────────
    console.log('\n[9] Plan entries')

    await check('Can open recipe picker for Monday breakfast', async () => {
      // breakfast = row 0, Monday = td index 1 (td 0 is the slot label)
      const cell = page.locator('tbody tr').nth(0).locator('td').nth(1)
      // Clear any stale entry left by a previous audit run before checking
      const isEmpty = await cell.locator('button:has-text("+ add")').count() > 0
      if (!isEmpty) {
        await cell.locator('button').first().click()  // click filled cell → soft-deletes entry
        // wait for the mutation + refetch to complete before looking for the add button
        await cell.locator('button:has-text("+ add")').waitFor({ timeout: 10000 })
      }
      await cell.locator('button:has-text("+ add")').click()
      await page.waitForSelector('[aria-labelledby="picker-title"]', { timeout: 5000 })
    })

    await check('Recipe list shows in picker', async () => {
      await page.waitForSelector(`button:has-text("Audit-${RUN_SUFFIX} (edited)")`, { timeout: 5000 })
    })

    await check('Picking a recipe closes the picker and fills the cell', async () => {
      await page.click(`button:has-text("Audit-${RUN_SUFFIX} (edited)")`)
      await page.waitForSelector('[aria-labelledby="picker-title"]', { state: 'detached', timeout: 5000 })
      await page.waitForTimeout(600)
    })

    await check('Week navigation: next week then back to today', async () => {
      await page.click('button[aria-label="Next week"]')
      await page.waitForTimeout(800)
      await page.click('button:has-text("Today")')
      await page.waitForTimeout(800)
    })

    // ── [10] Delete recipe ────────────────────────────────────────────────────
    console.log('\n[10] Delete recipe')

    await check('Navigate back to /recipes', async () => {
      await page.goto(`${NEXT_URL}/recipes`, { waitUntil: 'networkidle' })
      await page.waitForSelector(`a:has-text("Audit-${RUN_SUFFIX} (edited)")`, { timeout: 8000 })
    })

    await check('Delete confirmation dialog appears', async () => {
      const row = page.locator('tr').filter({ hasText: `Audit-${RUN_SUFFIX} (edited)` })
      await row.locator('button[aria-label="Recipe actions"]').click()
      await row.waitFor()
      await row.locator('button:has-text("Delete")').click()
      await page.waitForSelector('[role="alertdialog"]', { timeout: 5000 })
    })

    await check('Confirming delete removes recipe from list', async () => {
      await page.locator('[role="alertdialog"] button:has-text("Delete")').click()
      await page.waitForSelector(`a:has-text("Audit-${RUN_SUFFIX} (edited)")`, { state: 'detached', timeout: 8000 })
    })

    // ── [11] Sign-out ─────────────────────────────────────────────────────────
    console.log('\n[11] Sign-out')

    await check('Sign out redirects to login page', async () => {
      await page.click('button:has-text("Sign out")')
      await page.waitForSelector('input[type="email"]', { timeout: 8000 })
    })

    await check('After sign-out, /recipes redirects back to login', async () => {
      await page.goto(`${NEXT_URL}/recipes`, { waitUntil: 'networkidle' })
      await page.waitForSelector('input[type="email"]', { timeout: 5000 })
    })

  } finally {
    await context.close()
    await browser.close()
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok)

  console.log('\n' + '─'.repeat(50))
  console.log(`Results: ${passed}/${results.length} passed`)

  if (failed.length) {
    console.log('\nFailed checks:')
    failed.forEach(r => console.log(`  ✗  ${r.label}\n     ${r.detail ?? ''}`))
    if (consoleErrors.length) {
      console.log('\nBrowser console errors:')
      consoleErrors.slice(0, 10).forEach(e => console.log('  >', e))
    }
    process.exit(1)
  } else {
    console.log('\nAll checks passed.')
    if (consoleErrors.length) {
      console.log('\nBrowser console errors (non-fatal):')
      consoleErrors.slice(0, 10).forEach(e => console.log('  >', e))
    }
  }
}

main().catch(err => {
  console.error('\nAudit crashed:', err)
  process.exit(1)
})
