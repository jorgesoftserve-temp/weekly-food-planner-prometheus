'use client'

import { supabaseClient } from '@/utils/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export const useSupabase = (): SupabaseClient => supabaseClient()
