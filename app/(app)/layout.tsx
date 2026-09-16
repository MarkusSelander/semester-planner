import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { getOverdueEvents } from '@/lib/queries'
import { formatTz } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')

  if (!userId) {
    redirect('/login')
  }

  const [timeZone, overdue] = await Promise.all([
    getRequestTimezone(),
    getOverdueEvents(userId),
  ])
  const today = formatTz(new Date(), 'EEEE, d MMMM yyyy', timeZone)

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-slate-50">
        <AppHeader today={today} overdue={overdue} timeZone={timeZone} />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
