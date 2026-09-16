'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, isSameDay, startOfDay, isBefore } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { CalendarDays, Rows3 } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { getBrowserTimezone, toDateInputValue } from '@/lib/dates'
import { EmptyState } from '@/components/shared/EmptyState'

type CalendarEvent = {
  id: string
  title: string
  startAt: string
  endAt: string | null
  isAllDay: boolean
  type: string
  course: { color: string; name: string; code: string | null }
}

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

type CalEvent = {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  resource: {
    color: string
    type: string
    courseName: string
    courseCode: string | null
  }
}

type CalendarMode = 'calendar' | 'fourteenDay'

function mapEvents(events: CalendarEvent[]): CalEvent[] {
  const timeZone = getBrowserTimezone()
  return events.map(ev => {
    const start = ev.isAllDay
      ? parse(toDateInputValue(ev.startAt, timeZone, true), 'yyyy-MM-dd', new Date())
      : new Date(ev.startAt)
    const end = ev.endAt
      ? ev.isAllDay
        ? parse(toDateInputValue(ev.endAt, timeZone, true), 'yyyy-MM-dd', new Date())
        : new Date(ev.endAt)
      : new Date(start.getTime() + 60 * 60 * 1000)
    return {
      id: ev.id,
      title: ev.title,
      start,
      end,
      allDay: ev.isAllDay,
      resource: {
        color: ev.course.color,
        type: ev.type,
        courseName: ev.course.name,
        courseCode: ev.course.code,
      },
    }
  })
}

export function CalendarView({ initialEvents }: { initialEvents: CalendarEvent[] }) {
  const router = useRouter()
  const events = useMemo(() => mapEvents(initialEvents), [initialEvents])
  const [calendarView, setCalendarView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [mode, setMode] = useState<CalendarMode>('calendar')

  const eventStyleGetter = (event: CalEvent) => ({
    style: {
      backgroundColor: event.resource.color,
      borderColor: event.resource.color,
      color: '#fff',
      borderRadius: '6px',
      fontSize: '0.75rem',
      padding: '2px 6px',
    },
  })

  const timelineDays = useMemo(() => {
    const start = startOfDay(date)
    return Array.from({ length: 14 }, (_, i) => addDays(start, i))
  }, [date])

  const eventsByDay = useMemo(() => {
    return timelineDays.map(day => ({
      day,
      items: events
        .filter(ev => isSameDay(ev.start, day))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    }))
  }, [events, timelineDays])

  const prevFourteenDay = () => setDate(d => addDays(d, -14))
  const nextFourteenDay = () => setDate(d => addDays(d, 14))

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>

        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMode('calendar')}
            aria-pressed={mode === 'calendar'}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setMode('fourteenDay')}
            aria-pressed={mode === 'fourteenDay'}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'fourteenDay' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Rows3 className="h-4 w-4" />
            14-day
          </button>
        </div>
      </div>

      {initialEvents.length === 0 && (
        <div className="mb-4">
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Add events to see them on the calendar."
            actionLabel="Add event"
            actionHref="/events/new"
          />
        </div>
      )}

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 p-4">
        {mode === 'calendar' ? (
          <Calendar
            localizer={localizer}
            events={events}
            view={calendarView}
            onView={setCalendarView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={ev => router.push(`/events/${ev.id}`)}
            style={{ height: '100%' }}
            popup
          />
        ) : (
          <div className="h-full flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">{format(timelineDays[0], 'd MMM')} - {format(timelineDays[timelineDays.length - 1], 'd MMM yyyy')}</p>
              <div className="inline-flex gap-2">
                <button
                  type="button"
                  onClick={prevFourteenDay}
                  aria-label="Previous 14 days"
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setDate(new Date())}
                  aria-label="Go to today"
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={nextFourteenDay}
                  aria-label="Next 14 days"
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-lg border border-slate-200">
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
                  {timelineDays.map(day => (
                    <div key={day.toISOString()} className="px-3 py-2 text-center">
                      <p className="text-xs text-slate-500">{format(day, 'EEE')}</p>
                      <p className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-indigo-600' : 'text-slate-800'}`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[repeat(14,minmax(0,1fr))]">
                  {eventsByDay.map(({ day, items }) => (
                    <div key={day.toISOString()} className="min-h-[420px] border-r border-slate-100 p-2 last:border-r-0">
                      <div className="space-y-2">
                        {items.length === 0 ? (
                          <div className="rounded-md border border-dashed border-slate-200 p-2 text-center text-xs text-slate-400">No events</div>
                        ) : (
                          items.map(ev => (
                            <button
                              type="button"
                              key={ev.id}
                              onClick={() => router.push(`/events/${ev.id}`)}
                              className={`w-full rounded-md border p-2 text-left transition ${
                                isBefore(ev.start, new Date()) ? 'opacity-60' : 'opacity-100'
                              }`}
                              style={{ borderColor: ev.resource.color + '44', backgroundColor: ev.resource.color + '14' }}
                            >
                              <p className="truncate text-xs font-semibold text-slate-900">{ev.title}</p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-600">{ev.resource.courseCode ?? ev.resource.courseName}</p>
                              <p className="mt-1 text-[11px] text-slate-500">{ev.allDay ? 'All day' : format(ev.start, 'HH:mm')}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
