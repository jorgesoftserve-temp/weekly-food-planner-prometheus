import { redirect } from 'next/navigation'
import { supabaseServerClient } from '@/utils/supabase/server'
import { UserProvider } from '@/contexts/user-context'
import { SignOutButton } from '@/app/_components/sign-out-button'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await supabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return (
    <UserProvider userId={user.id}>
      <div className="min-h-screen flex flex-col">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <span className="font-semibold text-gray-900">Recipe Box</span>
          <a href="/recipes" className="text-sm text-gray-600 hover:text-gray-900">
            Recipes
          </a>
          <a href="/plan" className="text-sm text-gray-600 hover:text-gray-900">
            Plan
          </a>
          <SignOutButton />
        </nav>
        <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </UserProvider>
  )
}
