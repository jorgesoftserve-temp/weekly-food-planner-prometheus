import { redirect } from 'next/navigation'
import { supabaseServerClient } from '@/utils/supabase/server'
import { LoginForm } from './_components/login-form'

export default async function HomePage() {
  const supabase = await supabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/recipes')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Recipe Box</h1>
          <p className="text-gray-500 mt-1 text-sm">Plan your week, one meal at a time.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
