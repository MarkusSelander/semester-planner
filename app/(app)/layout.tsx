import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { MobileNav } from '@/components/layout/MobileNav'
import { formatTz } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')

  if (!userId) {
    redirect('/login')
  }

  const timeZone = await getRequestTimezone()
  const today = formatTz(new Date(), 'EEEE d MMMM yyyy', timeZone)

  return (
    <div className="flex h-full bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader today={today} userId={userId} timeZone={timeZone} />
        <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  )
}
