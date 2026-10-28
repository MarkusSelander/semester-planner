import { headers } from 'next/headers'
import { getEvent } from '@/lib/queries'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ExternalLink } from 'lucide-react'
import { isBefore } from 'date-fns'
import { formatEvent, isTodayTz } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { EventActions, EventDoneCompleted, EventDoneScope, EventDoneStatus, EventDoneTitle } from './EventActions'
import { HandInTag, TypeBadge } from '@/components/event-type'
import { BackLink } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'

const priorityLabel: Record<string, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

function eventStatus(event: { isDone: boolean; startAt: Date }, timeZone: string) {
  if (event.isDone) return { label: 'Done', cls: 'text-done' }
  if (isTodayTz(event.startAt, timeZone)) return { label: 'Today', cls: 'text-foreground' }
  if (isBefore(event.startAt, new Date())) return { label: 'Overdue', cls: 'text-overdue' }
  return { label: 'Upcoming', cls: 'text-muted-foreground' }
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')
  const timeZone = await getRequestTimezone()

  const event = await getEvent(userId, eventId)
  if (!event) notFound()

  const status = eventStatus(event, timeZone)

  const completedText = event.doneAt
    ? `Completed ${formatEvent(event.doneAt, 'd MMM yyyy', timeZone)}`
    : null

  return (
    <PageShell width="wide">
      <EventDoneScope key={`${eventId}:${event.isDone}`} isDone={event.isDone}>
      <BackLink href="/list">All events</BackLink>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="min-w-0 flex-1">
          <p className="page-kicker flex flex-wrap items-center gap-3">
            <TypeBadge type={event.type} />
            <HandInTag type={event.type} />
            <span>{priorityLabel[event.priority] ?? event.priority} priority</span>
            <EventDoneStatus whenOpen={status} />
          </p>
          <EventDoneTitle>{event.title}</EventDoneTitle>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            <Link href={`/courses/${event.course.id}`} className="hover:text-foreground">
              {event.course.code ?? event.course.name}
            </Link>
            {' · '}
            <Link href={`/semesters/${event.semester.id}`} className="hover:text-foreground">
              {event.semester.name}
            </Link>
          </p>
        </div>
        <EventActions
          eventId={eventId}
          snapshot={{
            courseId: event.courseId ?? event.course.id,
            semesterId: event.semesterId ?? event.semester.id,
            title: event.title,
            description: event.description,
            type: String(event.type),
            startAt: event.startAt.toISOString(),
            endAt: event.endAt?.toISOString() ?? null,
            isAllDay: event.isAllDay,
            priority: String(event.priority),
            location: event.location,
            url: event.url,
            notes: event.notes,
          }}
        />
      </header>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <section>
            <p className="page-kicker">When</p>
            <p className="font-heading text-2xl tracking-tight">
              {event.isAllDay
                ? formatEvent(event.startAt, 'EEEE d MMMM yyyy', timeZone, true)
                : formatEvent(event.startAt, 'EEEE d MMMM yyyy · HH:mm', timeZone)}
              {event.endAt && !event.isAllDay && `–${formatEvent(event.endAt, 'HH:mm', timeZone)}`}
              {event.isAllDay && <span className="ml-2 font-sans text-base text-muted-foreground">All day</span>}
            </p>
            <EventDoneCompleted text={completedText} />
          </section>

          {event.description && (
            <section>
              <p className="page-kicker">Description</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{event.description}</p>
            </section>
          )}

          {event.notes && (
            <section>
              <p className="page-kicker">Notes</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{event.notes}</p>
            </section>
          )}
        </div>

        <aside className="space-y-6 text-sm xl:col-span-4">
          {(event.location || event.url) && (
            <section>
              <p className="page-kicker">Place</p>
              {event.location && (
                <p className="flex items-start gap-2 text-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  {event.location}
                </p>
              )}
              {event.url && (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-start gap-2 break-all text-foreground underline-offset-4 hover:underline"
                >
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  {event.url}
                </a>
              )}
            </section>
          )}
        </aside>
      </div>
      </EventDoneScope>
    </PageShell>
  )
}
