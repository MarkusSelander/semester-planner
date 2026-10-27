import { headers } from 'next/headers'
import { getCourse } from '@/lib/queries'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { isBefore } from 'date-fns'
import {
  dateLabel,
  formatEvent,
  formatMonthHeading,
  isTodayTz,
  monthKeyFor,
} from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { HandInTag, TypeBadge, isActionRequired } from '@/components/event-type'
import { BackLink } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'
import { DateRail } from '@/components/layout/DateRail'

function eventStatus(event: { isDone: boolean; startAt: Date }, timeZone: string) {
  if (event.isDone) return { label: 'Done', cls: 'text-done' }
  if (isTodayTz(event.startAt, timeZone)) return { label: 'Today', cls: 'text-foreground' }
  if (isBefore(event.startAt, new Date())) return { label: 'Overdue', cls: 'text-overdue' }
  return { label: 'Upcoming', cls: 'text-muted-foreground' }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')
  const timeZone = await getRequestTimezone()

  const course = await getCourse(userId, courseId)
  if (!course) notFound()

  const now = new Date()
  const overdueEvents = course.events.filter(event => event.startAt < now && !event.isDone)

  const eventsByMonth = course.events.reduce<Record<string, typeof course.events>>((acc, event) => {
    const key = monthKeyFor(event.startAt, timeZone, event.isAllDay)
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {})
  const monthKeys = Object.keys(eventsByMonth).sort()

  return (
    <PageShell width="wide">
      <BackLink href="/courses">All courses</BackLink>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-start gap-3">
          <span className="mt-2 h-8 w-0.5 shrink-0" style={{ backgroundColor: course.color }} />
          <div>
            <p className="page-kicker">Course</p>
            <h1 className="page-title">{course.name}</h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {course.code && <span className="mr-2 uppercase tracking-[0.08em]">{course.code}</span>}
              {course.semester.name}
            </p>
          </div>
        </div>
        <ButtonLink href={`/courses/${courseId}/edit`} variant="outline" size="sm">
          <Edit className="h-4 w-4" strokeWidth={1.75} />
          Edit
        </ButtonLink>
      </header>

      {overdueEvents.length > 0 && (
        <section className="mb-8">
          <p className="page-kicker">Overdue</p>
          <div className="space-y-3">
            {overdueEvents.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <p className="text-sm text-foreground">{event.title}</p>
                <p className="font-mono text-[11px] text-overdue">{dateLabel(event.startAt, timeZone, event.isAllDay)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {course.events.length === 0 ? (
        <p className="py-12 text-sm text-muted-foreground">No events on this course yet.</p>
      ) : (
        <div className="space-y-10">
          {monthKeys.map(monthKey => (
            <section key={monthKey}>
              <h2 className="mb-4 font-heading text-xl tracking-tight">
                {formatMonthHeading(monthKey, 'MMMM yyyy')}
              </h2>
              <div className="space-y-4">
                {eventsByMonth[monthKey].map(event => {
                  const status = eventStatus(event, timeZone)
                  return (
                    <DateRail
                      key={event.id}
                      day={formatEvent(event.startAt, 'd', timeZone, event.isAllDay)}
                      time={event.isAllDay ? 'All day' : formatEvent(event.startAt, 'HH:mm', timeZone)}
                      muted={event.isDone}
                    >
                      <Link href={`/events/${event.id}`} className="block py-0.5 hover:text-primary">
                        <p className={`truncate text-sm ${event.isDone ? 'line-through text-muted-foreground' : isActionRequired(event.type) ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {event.title}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                          <TypeBadge type={event.type} />
                          {!event.isDone && <HandInTag type={event.type} />}
                          <span className={status.cls}>{status.label}</span>
                        </p>
                      </Link>
                    </DateRail>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  )
}
