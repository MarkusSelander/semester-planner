import { Suspense } from 'react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'
import { formatTz } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { DashboardNext, DashboardSemesters, DashboardToday, DashboardWeek } from './sections'
import { NextBodySkeleton, SemesterListSkeleton, TodayCountSkeleton } from './skeletons'
import { DateRailSkeleton } from '@/components/shared/DateRailSkeleton'

export default async function DashboardPage() {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const timeZone = await getRequestTimezone()

  return (
    <PageShell width="wide">
      <PageHeader
        kicker={formatTz(new Date(), 'EEEE yyyy', timeZone)}
        title={formatTz(new Date(), 'd MMMM', timeZone)}
        actions={
          <>
            <ButtonLink href="/semesters/new" variant="outline" size="sm">
              New semester
            </ButtonLink>
            <ButtonLink href="/events/new" size="sm">
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Add event
            </ButtonLink>
          </>
        }
      />

      <section className="reveal border-b border-border pb-8">
        <p className="page-kicker">Next</p>
        <Suspense fallback={<NextBodySkeleton />}>
          <DashboardNext userId={userId} timeZone={timeZone} />
        </Suspense>
      </section>

      <div className="reveal reveal-2 mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <p className="page-kicker mb-0">This week</p>
            <Link href="/list" className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">
              All events
            </Link>
          </div>
          <Suspense fallback={<DateRailSkeleton rows={3} />}>
            <DashboardWeek userId={userId} timeZone={timeZone} />
          </Suspense>
        </section>

        <aside className="reveal reveal-3 space-y-8 text-sm">
          <div>
            <p className="page-kicker">Today</p>
            <Suspense fallback={<TodayCountSkeleton />}>
              <DashboardToday userId={userId} timeZone={timeZone} />
            </Suspense>
          </div>

          <div>
            <p className="page-kicker">Semester</p>
            <Suspense fallback={<SemesterListSkeleton />}>
              <DashboardSemesters userId={userId} />
            </Suspense>
          </div>

          <div>
            <p className="page-kicker">Import</p>
            <Link href="/semesters" className="text-foreground underline-offset-4 hover:underline">
              PDF schedule
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
