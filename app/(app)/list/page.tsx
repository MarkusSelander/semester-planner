'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, CheckCircle2, Circle, CalendarArrowDown } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { format, isToday, isTomorrow, isThisWeek, isBefore } from 'date-fns'
import { toast } from 'sonner'

const TYPE_BADGE: Record<string, string> = {
  EXAM:       'bg-red-50 text-red-600 ring-1 ring-red-200',
  ASSIGNMENT: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
  PROJECT:    'bg-purple-50 text-purple-600 ring-1 ring-purple-200',
  EXERCISE:   'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  LECTURE:    'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  OTHER:      'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
}

type Event = {
  id: string
  title: string
  type: string
  startAt: string
  isDone: boolean
  course: { id: string; name: string; code: string | null; color: string }
}

type Semester = { id: string; name: string }

function dateLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, 'EEEE')
  return format(d, 'd MMM yyyy')
}

function groupByDate(events: Event[]) {
  const groups: Record<string, Event[]> = {}
  for (const ev of events) {
    const key = new Date(ev.startAt).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }
  return groups
}

function eventStatus(ev: Event) {
  const d = new Date(ev.startAt)
  if (ev.isDone) return { label: 'Done', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' }
  if (isToday(d)) return { label: 'Today', cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' }
  if (isBefore(d, new Date())) return { label: 'Overdue', cls: 'bg-red-50 text-red-700 ring-1 ring-red-200' }
  return { label: 'Upcoming', cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' }
}

export default function ListPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [events, setEvents] = useState<Event[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)

  const semesterId = searchParams.get('semesterId') ?? ''
  const typeFilter = searchParams.get('type') ?? ''
  const doneFilter = searchParams.get('done') ?? ''

  const fetchEvents = useCallback(() => {
    setLoading(true)
    const sp = new URLSearchParams()
    if (semesterId) sp.set('semesterId', semesterId)
    if (typeFilter) sp.set('type', typeFilter)
    if (doneFilter) sp.set('done', doneFilter)
    fetch(`/api/events?${sp}`)
      .then(r => r.json())
      .then(j => setEvents(j.data ?? []))
      .finally(() => setLoading(false))
  }, [semesterId, typeFilter, doneFilter])

  useEffect(() => {
    fetch('/api/semesters').then(r => r.json()).then(j => setSemesters(j.data ?? []))
  }, [])

  useEffect(() => { queueMicrotask(fetchEvents) }, [fetchEvents])

  function setParam(key: string, value: string) {
    const sp = new URLSearchParams(searchParams.toString())
    if (value) sp.set(key, value)
    else sp.delete(key)
    router.push(`/list?${sp}`)
  }

  async function toggleDone(ev: Event) {
    try {
      await fetch(`/api/events/${ev.id}/done`, { method: 'PATCH' })
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, isDone: !e.isDone } : e))
    } catch {
      toast.error('Failed to update')
    }
  }

  const grouped = groupByDate(events)
  const dateKeys = Object.keys(grouped).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <div className="flex gap-2">
          <ButtonLink
            href={`/api/export/ics${semesterId ? `?semesterId=${semesterId}` : ''}`}
            variant="outline"
          >
            <CalendarArrowDown className="h-4 w-4 mr-1.5" />
            Export
          </ButtonLink>
          <ButtonLink href="/events/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Add event
          </ButtonLink>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'semesterId', value: semesterId, options: [{ value: '', label: 'All semesters' }, ...semesters.map(s => ({ value: s.id, label: s.name }))] },
        ].map(({ key, value, options }) => (
          <select
            key={key}
            value={value}
            onChange={e => setParam(key, e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}

        <select
          value={typeFilter}
          onChange={e => setParam('type', e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All types</option>
          {['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER'].map(t => (
            <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>
          ))}
        </select>

        <select
          value={doneFilter}
          onChange={e => setParam('done', e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All</option>
          <option value="false">Upcoming</option>
          <option value="true">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 py-16 text-center">Loading…</div>
      ) : events.length === 0 ? (
        <div className="text-sm text-slate-400 py-16 text-center">No events found</div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map(key => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {dateLabel(grouped[key][0].startAt)}
                </h2>
                <span className="text-xs text-slate-400">{format(new Date(key), 'd MMM')}</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {grouped[key].map(ev => {
                  const status = eventStatus(ev)
                  return (
                    <div
                      key={ev.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${ev.isDone ? 'opacity-60' : ''}`}
                    >
                    <button
                      onClick={() => toggleDone(ev)}
                      className="flex-shrink-0 text-slate-300 hover:text-emerald-500 transition-colors"
                    >
                      {ev.isDone
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        : <Circle className="h-5 w-5" />}
                    </button>

                    <div
                      className="w-1 h-7 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.course.color }}
                    />

                    <Link href={`/events/${ev.id}`} className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${ev.isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {ev.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ev.course.code ?? ev.course.name} · {format(new Date(ev.startAt), 'HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[ev.type] ?? ''}`}>
                          {ev.type[0] + ev.type.slice(1).toLowerCase()}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
                          {status.label}
                        </span>
                      </div>
                    </Link>
                  </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
