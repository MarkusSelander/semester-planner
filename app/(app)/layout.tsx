import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')

  if (!userId) {
    redirect('/login')
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  )
}
