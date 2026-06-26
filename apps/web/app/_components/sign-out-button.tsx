'use client'

import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/utils/supabase/client'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await supabaseClient().auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="ml-auto text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      Sign out
    </button>
  )
}
