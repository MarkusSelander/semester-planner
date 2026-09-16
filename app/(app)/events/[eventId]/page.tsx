import { headers } from 'next/headers'
import { getEvent } from '@/lib/queries'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, ExternalLink, FileText, CalendarClock } from 'lucide-react'
import { formatEvent } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { eventStatus, eventTypeLabel, eventTypeStyle, priorityLabel, priorityStyle } from '@/lib/event-display'
import { BackLink } from '@/components/shared/BackLink'
import { EventActions } from './EventActions'

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')
  const timeZone = await getRequestTimezone()

  const event = await getEvent(userId, eventId)
  if (!event) notFound()

  const status = eventStatus(event, timeZone)
  const typeStyle = eventTypeStyle(event.type)
  const hasLogistics = Boolean(event.location || event.url)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-5">
      <BackLink href="/list">All events</BackLink>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeStyle.badge}`}>{eventTypeLabel(event.type)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyle(event.priority)}`}>{priorityLabel(event.priority)} priority</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
            </div>

            <h1 className={`text-3xl font-bold tracking-tight ${event.isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
              {event.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Link href={`/courses/${event.course.id}`} className="inline-flex items-center gap-2 hover:text-slate-800 transition-colors">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: event.course.color }} />
                <span className="font-medium">{event.course.name}</span>
                {event.course.code && <span className="text-slate-400 font-mono">{event.course.code}</span>}
              </Link>
              <span className="text-slate-300">·</span>
              <Link href={`/semesters/${event.semester.id}`} className="hover:text-slate-800 transition-colors">{event.semester.name}</Link>
            </div>
          </div>

          <EventActions eventId={eventId} isDone={event.isDone} />
        </div>
      </section>

      <div className={hasLogistics ? 'grid grid-cols-1 xl:grid-cols-12 gap-5' : ''}>
        <div className={hasLogistics ? 'xl:col-span-8 space-y-5' : 'space-y-5'}>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Schedule</h2>
            </div>
            {event.isAllDay ? (
              <p className="text-base text-slate-800">{formatEvent(event.startAt, 'EEEE, d MMMM yyyy', timeZone, true)} · All day</p>
            ) : (
              <p className="text-base text-slate-800">
                {formatEvent(event.startAt, 'EEEE, d MMMM yyyy · HH:mm', timeZone)}
                {event.endAt && ` - ${formatEvent(event.endAt, 'HH:mm', timeZone)}`}
              </p>
            )}
            {event.isDone && event.doneAt && (
              <p className="text-xs text-emerald-600 mt-2">Completed {formatEvent(event.doneAt, 'd MMM yyyy', timeZone)}</p>
            )}
          </section>

          {event.description && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800 mb-2">Description</h2>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{event.description}</p>
            </section>
          )}

          {event.notes && (
            <section className="rounded-2xl border border-yellow-200 bg-yellow-50/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-yellow-700" />
                <h2 className="text-sm font-semibold text-yellow-900">Notes</h2>
              </div>
              <p className="text-sm leading-relaxed text-yellow-900/90 whitespace-pre-wrap">{event.notes}</p>
            </section>
          )}
        </div>

        {hasLogistics && (
          <div className="xl:col-span-4 space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Logistics</h2>
              <div className="space-y-3 text-sm">
                {event.location && (
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.url && (
                  <div className="flex items-start gap-2">
                    <ExternalLink className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                      {event.url}
                    </a>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
