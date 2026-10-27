'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle2, Circle, CalendarArrowDown } from 'lucide-react'
import { ButtonAnchor, ButtonLink } from '@/components/ui/button'
import { isBefore } from 'date-fns'
import { toast } from 'sonner'
import type { ListEvent } from '@/lib/queries'
import {
  calendarDayKey,
  dateLabel,
  formatEvent,
  formatTz,
  isTodayTz,
} from '@/lib/dates'
import { HandInTag, TypeBadge, isActionRequired } from '@/components/event-type'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'
import { DateRail } from '@/components/layout/DateRail'

type Semester = { id: string; name: string }
type View = 'all' | 'tasks' | 'lectures'

const TABS: { value: View; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'lectures', label: 'Lectures' },
]

type BaseStatus = 'Today' | 'Overdue' | 'Upcoming'

const STATUS_CLS: Record<BaseStatus | 'Done', string> = {
  Done: 'text-done',
  Today: 'text-foreground',
  Overdue: 'text-overdue',
  Upcoming: 'text-muted-foreground',
}

type RowDisplay = { dayKey: string; day: string; time: string; baseStatus: BaseStatus; isPast: boolean }

function rowDisplay(ev: ListEvent, timeZone: string, now: Date): RowDisplay {
  const d = new Date(ev.startAt)
  const isPast = isBefore(d, now)
  return {
    dayKey: calendarDayKey(ev.startAt, timeZone, ev.isAllDay),
    day: formatEvent(ev.startAt, 'd', timeZone, ev.isAllDay),
    time: ev.isAllDay ? 'All day' : formatEvent(ev.startAt, 'HH:mm', timeZone),
    baseStatus: isTodayTz(d, timeZone) ? 'Today' : isPast ? 'Overdue' : 'Upcoming',
    isPast,
  }
}

const EventRow = memo(function EventRow({
  ev,
  isDone,
  display,
  onToggle,
}: {
  ev: ListEvent
  isDone: boolean
  display: RowDisplay
  onToggle: (id: string) => void
}) {
  const status = isDone ? 'Done' : display.baseStatus
  const emphasize = isActionRequired(ev.type)
  return (
    <DateRail day={display.day} time={display.time} muted={isDone}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(ev.id)}
          aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
          className="mt-0.5 text-muted-foreground transition-colors duration-200 ease-out-quart hover:text-done"
        >
          {isDone
            ? <CheckCircle2 className="h-4 w-4 text-done" strokeWidth={1.75} />
            : <Circle className="h-4 w-4" strokeWidth={1.75} />}
        </button>
        <Link href={`/events/${ev.id}`} className="min-w-0 flex-1">
          <p className={`truncate text-sm ${isDone ? 'text-muted-foreground line-through' : emphasize ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
            {ev.title}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="inline-block h-2.5 w-0.5" style={{ backgroundColor: ev.course.color }} />
            <span>{ev.course.code ?? ev.course.name}</span>
            <TypeBadge type={ev.type} />
            {!isDone && <HandInTag type={ev.type} />}
            <span className={STATUS_CLS[status]}>{status}</span>
          </p>
        </Link>
      </div>
    </DateRail>
  )
})

export function EventList({
  initialEvents,
  semesters,
  semesterId,
  typeFilter,
  doneFilter,
  view,
  overdueOnly = false,
  timeZone,
}: {
  initialEvents: ListEvent[]
  semesters: Semester[]
  semesterId: string
  typeFilter: string
  doneFilter: string
  view: View
  overdueOnly?: boolean
  timeZone: string
}) {
  const router = useRouter()
  const [doneById, setDoneById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialEvents.map(ev => [ev.id, ev.isDone]))
  )

  const displayById = useMemo(() => {
    const now = new Date()
    return new Map(initialEvents.map(ev => [ev.id, rowDisplay(ev, timeZone, now)]))
  }, [initialEvents, timeZone])

  const { grouped, dateKeys } = useMemo(() => {
    const visible = overdueOnly
      ? initialEvents.filter(ev => !doneById[ev.id] && displayById.get(ev.id)!.isPast)
      : initialEvents
    const groups: Record<string, ListEvent[]> = {}
    for (const ev of visible) {
      const key = displayById.get(ev.id)!.dayKey
      if (!groups[key]) groups[key] = []
      groups[key].push(ev)
    }
    const keys = Object.keys(groups).sort()
    return { grouped: groups, dateKeys: keys }
  }, [initialEvents, displayById, overdueOnly, doneById])

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

  const toggleDone = useCallback(async (id: string) => {
    const flip = () => setDoneById(prev => ({ ...prev, [id]: !prev[id] }))
    flip()
    try {
      const res = await fetch(`/api/events/${id}/done`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
    } catch {
      flip()
      toast.error('Failed to update')
    }
  }, [])

  return (
    <PageShell>
      <PageHeader
        kicker="Schedule"
        title={overdueOnly ? 'Overdue' : 'Events'}
        actions={
          <>
            <ButtonAnchor
              href={`/api/export/ics${semesterId ? `?semesterId=${semesterId}` : ''}`}
              download
              variant="outline"
              size="sm"
            >
              <CalendarArrowDown className="h-4 w-4" strokeWidth={1.75} />
              Export
            </ButtonAnchor>
            <ButtonLink href="/events/new" size="sm">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Add event
            </ButtonLink>
          </>
        }
      />

      {overdueOnly && (
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm text-muted-foreground">Started before now, still open.</p>
          <ButtonLink href="/list" variant="outline" size="sm">Show all</ButtonLink>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex gap-4 border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setView(tab.value)}
              className={`-mb-px border-b-2 pb-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 ease-out-quart ${
                view === tab.value
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={semesterId}
            onChange={e => setParam('semesterId', e.target.value)}
            className="field-select w-auto"
            aria-label="Semester"
          >
            <option value="">All semesters</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {view === 'all' && (
            <select
              value={typeFilter}
              onChange={e => setParam('type', e.target.value)}
              className="field-select w-auto"
              aria-label="Type"
            >
              <option value="">All types</option>
              {['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER'].map(t => (
                <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>
              ))}
            </select>
          )}

          <select
            value={doneFilter}
            onChange={e => setParam('done', e.target.value)}
            className="field-select w-auto"
            aria-label="Status"
          >
            <option value="">All</option>
            <option value="false">Upcoming</option>
            <option value="true">Completed</option>
          </select>
        </div>
      </div>

      {dateKeys.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {overdueOnly ? 'Nothing overdue.' : 'No events match these filters.'}
        </p>
      ) : (
        <div className="space-y-8">
          {dateKeys.map(key => (
            <section key={key}>
              <p className="page-kicker">
                {dateLabel(grouped[key][0].startAt, timeZone, grouped[key][0].isAllDay)}
                <span className="ml-2 font-normal tabular-nums">
                  {formatTz(`${key}T12:00:00Z`, 'd MMM', 'UTC')}
                </span>
              </p>
              <div className="space-y-4">
                {grouped[key].map(ev => (
                  <EventRow
                    key={ev.id}
                    ev={ev}
                    isDone={doneById[ev.id]}
                    display={displayById.get(ev.id)!}
                    onToggle={toggleDone}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  )
}
