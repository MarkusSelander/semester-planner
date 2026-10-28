import Link from 'next/link'
import { ButtonLink } from '@/components/ui/button'
import { DateRail } from '@/components/layout/DateRail'
import { HandInTag, TypeBadge, isActionRequired } from '@/components/event-type'
import {
  differenceInDaysTz,
  formatDateOnly,
  formatEvent,
  isTodayTz,
} from '@/lib/dates'
import { getActiveSemesters, getUpcomingEvents } from '@/lib/queries'

function relativeDue(date: Date, timeZone: string) {
  const days = differenceInDaysTz(date, timeZone)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `in ${days} days`
}

export async function DashboardNext({ userId, timeZone }: { userId: string; timeZone: string }) {
  const upcomingEvents = await getUpcomingEvents(userId)
  const nextEvent = upcomingEvents[0] ?? null

  if (!nextEvent) {
    return (
      <div>
        <p className="font-heading text-3xl tracking-tight text-foreground">Nothing queued.</p>
        <p className="mt-2 text-sm text-muted-foreground">Add the next lecture, deadline or exam.</p>
        <ButtonLink href="/events/new" className="mt-4" size="sm">Add event</ButtonLink>
      </div>
    )
  }

  return (
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
  )
}

export async function DashboardWeek({ userId, timeZone }: { userId: string; timeZone: string }) {
  const upcomingEvents = await getUpcomingEvents(userId)
  const thisWeekEvents = upcomingEvents.filter(event => differenceInDaysTz(event.startAt, timeZone) <= 7)

  if (thisWeekEvents.length === 0) {
    return <p className="text-sm text-muted-foreground">No events in the next seven days.</p>
  }

  return (
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
  )
}

export async function DashboardToday({ userId, timeZone }: { userId: string; timeZone: string }) {
  const upcomingEvents = await getUpcomingEvents(userId)
  const todayCount = upcomingEvents.filter(event => isTodayTz(event.startAt, timeZone)).length

  return (
    <>
      <p className="font-heading text-3xl tabular-nums tracking-tight">{todayCount}</p>
      <p className="mt-1 text-muted-foreground">{todayCount === 1 ? 'event' : 'events'}</p>
    </>
  )
}

export async function DashboardSemesters({ userId }: { userId: string }) {
  const semesters = await getActiveSemesters(userId)

  if (semesters.length === 0) {
    return <p className="text-muted-foreground">None active.</p>
  }

  return (
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
  )
}
