import { headers } from 'next/headers'
import { getEvent } from '@/lib/queries'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, ExternalLink, FileText } from 'lucide-react'
import { format, isToday, isBefore } from 'date-fns'
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
  HIGH: 'bg-red-50 text-red-600 border border-red-200',
  MEDIUM: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
  LOW: 'bg-slate-50 text-slate-500 border border-slate-200',
}

function eventStatus(event: { isDone: boolean; startAt: Date }) {
  if (event.isDone) return { label: 'Done', cls: 'bg-emerald-100 text-emerald-700' }
  if (isToday(event.startAt)) return { label: 'Today', cls: 'bg-blue-100 text-blue-700' }
  if (isBefore(event.startAt, new Date())) return { label: 'Overdue', cls: 'bg-red-100 text-red-700' }
  return { label: 'Upcoming', cls: 'bg-slate-100 text-slate-700' }
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')

  const event = await getEvent(userId, eventId)
  if (!event) notFound()
  const status = eventStatus(event)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/list" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColors[event.type] ?? ''}`}>
              {event.type}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColors[event.priority]}`}>
              {event.priority}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${status.cls}`}>{status.label}</span>
          </div>
          <h1 className={`text-2xl font-bold ${event.isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {event.title}
          </h1>
        </div>
        <EventActions eventId={eventId} isDone={event.isDone} />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={`/courses/${event.course.id}`}
            className="flex items-center gap-2 hover:underline"
          >
            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: event.course.color }} />
            <span className="font-medium text-slate-700">{event.course.name}</span>
            {event.course.code && <span className="text-slate-400 font-mono">{event.course.code}</span>}
          </Link>
          <span className="text-slate-300">·</span>
          <Link href={`/semesters/${event.semester.id}`} className="text-slate-500 hover:underline">
            {event.semester.name}
          </Link>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">When</p>
          {event.isAllDay ? (
            <p className="text-sm text-slate-900">{format(event.startAt, 'd MMMM yyyy')} — all day</p>
          ) : (
            <p className="text-sm text-slate-900">
              {format(event.startAt, 'd MMMM yyyy · HH:mm')}
              {event.endAt && ` – ${format(event.endAt, 'HH:mm')}`}
            </p>
          )}
          {event.isDone && event.doneAt && (
            <p className="text-xs text-green-600 mt-1">Completed {format(event.doneAt, 'd MMM yyyy')}</p>
          )}
        </div>

        {event.description && (
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {event.location && (
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <span>{event.location}</span>
          </div>
        )}

        {event.url && (
          <div className="flex items-start gap-2 text-sm">
            <ExternalLink className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {event.url}
            </a>
          </div>
        )}

        {event.notes && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-slate-400" />
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Notes</p>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-yellow-50 rounded-lg p-3 border border-yellow-100">
              {event.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
