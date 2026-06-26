import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let cachedAdmin: SupabaseClient | null = null

// Service-role client. Bypasses RLS — only use on the server for privileged ops.
export const supabaseAdminClient = (): SupabaseClient => {
  if (cachedAdmin) return cachedAdmin
  cachedAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
  return cachedAdmin
}
