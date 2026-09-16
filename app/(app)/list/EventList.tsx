'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle2, Circle, CalendarArrowDown, ListChecks } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'
import type { ListEvent } from '@/lib/queries'
import {
  calendarDayKey,
  dateLabel,
  formatEvent,
  formatTz,
  getBrowserTimezone,
} from '@/lib/dates'
import { EVENT_TYPES, eventStatus, eventTypeLabel, eventTypeStyle } from '@/lib/event-display'
import { selectClassName } from '@/lib/utils'

type Semester = { id: string; name: string }
type View = 'all' | 'tasks' | 'lectures'

const TABS: { value: View; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'lectures', label: 'Lectures' },
]

function eventDateLabel(dateStr: string, isAllDay: boolean, timeZone: string) {
  return dateLabel(dateStr, timeZone, isAllDay)
}

export function EventList({
  initialEvents,
  semesters,
  semesterId,
  typeFilter,
  doneFilter,
  view,
}: {
  initialEvents: ListEvent[]
  semesters: Semester[]
  semesterId: string
  typeFilter: string
  doneFilter: string
  view: View
}) {
  const router = useRouter()
  const [events, setEvents] = useState<ListEvent[]>(initialEvents)
  const timeZone = getBrowserTimezone()

  const { grouped, dateKeys } = useMemo(() => {
    const groups: Record<string, ListEvent[]> = {}
    for (const ev of events) {
      const key = calendarDayKey(ev.startAt, timeZone, ev.isAllDay)
      if (!groups[key]) groups[key] = []
      groups[key].push(ev)
    }
    const keys = Object.keys(groups).sort()
    return { grouped: groups, dateKeys: keys }
  }, [events, timeZone])

  function buildParams(overrides: Record<string, string>) {
    const sp = new URLSearchParams()
    if (semesterId) sp.set('semesterId', semesterId)
    if (typeFilter && view === 'all') sp.set('type', typeFilter)
    if (doneFilter) sp.set('done', doneFilter)
    if (view !== 'all') sp.set('view', view)
    for (const [k, v] of Object.entries(overrides)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    return sp.toString()
  }

  function setView(newView: View) {
    const sp = new URLSearchParams()
    if (semesterId) sp.set('semesterId', semesterId)
    if (doneFilter) sp.set('done', doneFilter)
    if (newView !== 'all') sp.set('view', newView)
    router.push(`/list?${sp}`)
  }

  function setParam(key: string, value: string) {
    router.push(`/list?${buildParams({ [key]: value })}`)
  }

  async function toggleDone(ev: ListEvent) {
    try {
      const res = await fetch(`/api/events/${ev.id}/done`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, isDone: !e.isDone } : e))
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
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

      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-5" role="tablist" aria-label="Event views">
        {TABS.map(tab => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={view === tab.value}
            onClick={() => setView(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={semesterId}
          onChange={e => setParam('semesterId', e.target.value)}
          aria-label="Filter by semester"
          className={selectClassName}
        >
          <option value="">All semesters</option>
          {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {view === 'all' && (
          <select
            value={typeFilter}
            onChange={e => setParam('type', e.target.value)}
            aria-label="Filter by type"
            className={selectClassName}
          >
            <option value="">All types</option>
            {EVENT_TYPES.map(t => (
              <option key={t} value={t}>{eventTypeLabel(t)}</option>
            ))}
          </select>
        )}

        <select
          value={doneFilter}
          onChange={e => setParam('done', e.target.value)}
          aria-label="Filter by status"
          className={selectClassName}
        >
          <option value="">Any status</option>
          <option value="false">Upcoming</option>
          <option value="true">Completed</option>
        </select>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No events found"
          description="Create an event or change the filters to see your schedule."
          actionLabel="Add event"
          actionHref="/events/new"
        />
      ) : (
        <div className="space-y-6">
          {dateKeys.map(key => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {eventDateLabel(grouped[key][0].startAt, grouped[key][0].isAllDay, timeZone)}
                </h2>
                <span className="text-xs text-slate-400">{formatTz(`${key}T12:00:00Z`, 'd MMM', 'UTC')}</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {grouped[key].map(ev => {
                  const status = eventStatus(ev, timeZone)
                  const styles = eventTypeStyle(ev.type)
                  return (
                    <div
                      key={ev.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${ev.isDone ? 'opacity-60' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDone(ev)}
                        aria-label={ev.isDone ? 'Mark as not done' : 'Mark as done'}
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
                            {ev.course.code ?? ev.course.name} · {ev.isAllDay ? 'All day' : formatEvent(ev.startAt, 'HH:mm', timeZone)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
                            {eventTypeLabel(ev.type)}
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
