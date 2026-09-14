import { headers } from 'next/headers'
import { getEvent } from '@/lib/queries'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, ExternalLink, FileText, CalendarClock, CircleDot } from 'lucide-react'
import { isBefore } from 'date-fns'
import { formatEvent, isTodayTz } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { EventActions } from './EventActions'

const typeColors: Record<string, string> = {
  EXAM: 'bg-red-100 text-red-700',
  ASSIGNMENT: 'bg-orange-100 text-orange-700',
  PROJECT: 'bg-purple-100 text-purple-700',
  EXERCISE: 'bg-blue-100 text-blue-700',
  LECTURE: 'bg-slate-100 text-slate-700',
  OTHER: 'bg-slate-100 text-slate-600',
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-700 border border-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-200',
  LOW: 'bg-slate-50 text-slate-600 border border-slate-200',
}

function eventStatus(event: { isDone: boolean; startAt: Date }, timeZone: string) {
  if (event.isDone) return { label: 'Done', cls: 'bg-emerald-100 text-emerald-700' }
  if (isTodayTz(event.startAt, timeZone)) return { label: 'Today', cls: 'bg-blue-100 text-blue-700' }
  if (isBefore(event.startAt, new Date())) return { label: 'Overdue', cls: 'bg-red-100 text-red-700' }
  return { label: 'Upcoming', cls: 'bg-slate-100 text-slate-700' }
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')
  const timeZone = await getRequestTimezone()

  const event = await getEvent(userId, eventId)
  if (!event) notFound()

  const status = eventStatus(event, timeZone)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-5">
      <Link href="/list" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColors[event.type] ?? ''}`}>{event.type}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColors[event.priority]}`}>{event.priority} priority</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${status.cls}`}>{status.label}</span>
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
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

        <div className="xl:col-span-4 space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Context</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Status</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Type</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeColors[event.type] ?? ''}`}>{event.type}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Priority</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColors[event.priority]}`}>{event.priority}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Course</span>
                <Link href={`/courses/${event.course.id}`} className="text-slate-800 hover:underline text-right">{event.course.code ?? event.course.name}</Link>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Semester</span>
                <Link href={`/semesters/${event.semester.id}`} className="text-slate-800 hover:underline text-right">{event.semester.name}</Link>
              </div>
            </div>
          </section>

          {(event.location || event.url) && (
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
                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {event.url}
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Quick links</h2>
            <div className="space-y-2">
              <Link href={`/courses/${event.course.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Open course
                <CircleDot className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <Link href={`/semesters/${event.semester.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Open semester
                <CircleDot className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
