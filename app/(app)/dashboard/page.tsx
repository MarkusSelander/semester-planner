import { headers } from 'next/headers'
import { getActiveSemesters, getUpcomingEvents } from '@/lib/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'
import { DateRail } from '@/components/layout/DateRail'
import {
  differenceInDaysTz,
  formatDateOnly,
  formatEvent,
  formatTz,
  isTodayTz,
} from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { HandInTag, TypeBadge, isActionRequired } from '@/components/event-type'

function relativeDue(date: Date, timeZone: string) {
  const days = differenceInDaysTz(date, timeZone)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `in ${days} days`
}

export default async function DashboardPage() {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const [semesters, upcomingEvents] = await Promise.all([
    getActiveSemesters(userId),
    getUpcomingEvents(userId),
  ])

  const timeZone = await getRequestTimezone()
  const nextEvent = upcomingEvents[0] ?? null
  const thisWeekEvents = upcomingEvents.filter(e => differenceInDaysTz(e.startAt, timeZone) <= 7)
  const todayCount = upcomingEvents.filter(e => isTodayTz(e.startAt, timeZone)).length

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
        {!nextEvent ? (
          <div>
            <p className="font-heading text-3xl tracking-tight text-foreground">Nothing queued.</p>
            <p className="mt-2 text-sm text-muted-foreground">Add the next lecture, deadline or exam.</p>
            <ButtonLink href="/events/new" className="mt-4" size="sm">Add event</ButtonLink>
          </div>
        ) : (
          <Link href={`/events/${nextEvent.id}`} className="group block">
            <h2 className="font-heading text-3xl tracking-tight text-foreground transition-colors duration-200 ease-out-quart group-hover:text-primary md:text-4xl">
              {nextEvent.title}
            </h2>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums text-muted-foreground">
              <span className={isActionRequired(nextEvent.type) ? 'text-overdue' : ''}>
                {relativeDue(nextEvent.startAt, timeZone)}
              </span>
              <span>
                {nextEvent.isAllDay
                  ? formatEvent(nextEvent.startAt, 'd MMM', timeZone, true)
                  : formatEvent(nextEvent.startAt, 'EEE d MMM · HH:mm', timeZone)}
              </span>
              <span>{nextEvent.course.code ?? nextEvent.course.name}</span>
              <TypeBadge type={nextEvent.type} />
              <HandInTag type={nextEvent.type} />
            </p>
          </Link>
        )}
      </section>

      <div className="reveal reveal-2 mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <p className="page-kicker mb-0">This week</p>
            <Link href="/list" className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">
              All events
            </Link>
          </div>
          {thisWeekEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events in the next seven days.</p>
          ) : (
            <div className="space-y-5">
              {thisWeekEvents.map(event => {
                const emphasize = isActionRequired(event.type)
                const today = isTodayTz(event.startAt, timeZone)
                return (
                  <DateRail
                    key={event.id}
                    day={formatEvent(event.startAt, 'd', timeZone, event.isAllDay)}
                    weekday={today ? 'Today' : formatEvent(event.startAt, 'EEE', timeZone, event.isAllDay)}
                    time={event.isAllDay ? 'All day' : formatEvent(event.startAt, 'HH:mm', timeZone)}
                  >
                    <Link href={`/events/${event.id}`} className="block py-0.5 hover:text-primary">
                      <p className={`truncate text-sm ${emphasize ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {event.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                        <span>{event.course.code ?? event.course.name}</span>
                        <TypeBadge type={event.type} />
                        <HandInTag type={event.type} />
                      </p>
                    </Link>
                  </DateRail>
                )
              })}
            </div>
          )}
        </section>

        <aside className="reveal reveal-3 space-y-8 text-sm">
          <div>
            <p className="page-kicker">Today</p>
            <p className="font-heading text-3xl tabular-nums tracking-tight">{todayCount}</p>
            <p className="mt-1 text-muted-foreground">{todayCount === 1 ? 'event' : 'events'}</p>
          </div>

          <div>
            <p className="page-kicker">Semester</p>
            {semesters.length === 0 ? (
              <p className="text-muted-foreground">None active.</p>
            ) : (
              <ul className="space-y-3">
                {semesters.map(semester => (
                  <li key={semester.id}>
                    <Link href={`/semesters/${semester.id}`} className="block hover:text-primary">
                      <p className="text-foreground">{semester.name}</p>
                      <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {formatDateOnly(semester.startDate, 'd MMM')} – {formatDateOnly(semester.endDate, 'd MMM yyyy')}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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
