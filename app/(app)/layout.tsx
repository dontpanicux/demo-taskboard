import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/nav/Navbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar userEmail={user.email} userName={userName} />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
