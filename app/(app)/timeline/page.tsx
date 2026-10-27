import { headers } from 'next/headers'
import { getTimelineEvents } from '@/lib/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatEvent, formatMonthHeading, formatTz, monthKeyFor } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { TimelineScroller } from './TimelineScroller'
import { HandInTag, TypeBadge, isActionRequired } from '@/components/event-type'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'
import { DateRail } from '@/components/layout/DateRail'

export default async function TimelinePage() {
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')

  const timeZone = await getRequestTimezone()
  const now = new Date()

  const events = await getTimelineEvents(userId, 500)

  const groups: Record<string, typeof events> = {}
  for (const ev of events) {
    const key = monthKeyFor(ev.startAt, timeZone, ev.isAllDay)
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }

  const monthKeys = Object.keys(groups).sort()
  const currentMonthKey = formatTz(now, 'yyyy-MM', timeZone)

  return (
    <PageShell>
      <TimelineScroller currentMonthKey={currentMonthKey} />
      <PageHeader kicker="Year" title="Timeline" />

      {monthKeys.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <div className="space-y-12">
          {monthKeys.map(monthKey => {
            const monthEvents = groups[monthKey]
            return (
              <section key={monthKey} id={monthKey}>
                <h2 className="mb-5 font-heading text-2xl tracking-tight">
                  {formatMonthHeading(monthKey, 'MMMM')}
                  <span className="ml-2 font-mono text-sm text-muted-foreground">
                    {formatMonthHeading(monthKey, 'yyyy')}
                  </span>
                </h2>
                <div className="space-y-5">
                  {monthEvents.map(ev => {
                    const emphasize = isActionRequired(ev.type)
                    const past = ev.startAt < now
                    return (
                      <DateRail
                        key={ev.id}
                        day={formatEvent(ev.startAt, 'd', timeZone, ev.isAllDay)}
                        weekday={formatEvent(ev.startAt, 'EEE', timeZone, ev.isAllDay)}
                        time={ev.isAllDay ? undefined : formatEvent(ev.startAt, 'HH:mm', timeZone)}
                        muted={past}
                      >
                        <Link href={`/events/${ev.id}`} className="block py-0.5 hover:text-primary">
                          <p className={`truncate text-sm ${ev.isDone ? 'text-muted-foreground line-through' : emphasize ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {ev.title}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                            <span
                              className="inline-block h-2.5 w-0.5"
                              style={{ backgroundColor: ev.course.color }}
                            />
                            <span>{ev.course.code ?? ev.course.name}</span>
                            <span>{ev.semester.name}</span>
                            <TypeBadge type={ev.type} />
                            {!ev.isDone && <HandInTag type={ev.type} />}
                          </p>
                        </Link>
                      </DateRail>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
