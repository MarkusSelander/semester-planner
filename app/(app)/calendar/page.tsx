'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, isSameDay, startOfDay, isBefore } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { CalendarDays, Rows3 } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

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

type ApiEvent = {
  id: string
  title: string
  startAt: string
  endAt: string | null
  isAllDay: boolean
  type: string
  course: { color: string; name: string; code: string | null }
}

type CalendarMode = 'calendar' | 'timeline'

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [calendarView, setCalendarView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [mode, setMode] = useState<CalendarMode>('calendar')

  useEffect(() => {
    fetch('/api/events?from=2000-01-01')
      .then(r => r.json())
      .then(j => {
        const mapped: CalEvent[] = (j.data ?? []).map((ev: ApiEvent) => ({
          id: ev.id,
          title: ev.title,
          start: new Date(ev.startAt),
          end: ev.endAt ? new Date(ev.endAt) : new Date(new Date(ev.startAt).getTime() + 60 * 60 * 1000),
          allDay: ev.isAllDay,
          resource: {
            color: ev.course.color,
            type: ev.type,
            courseName: ev.course.name,
            courseCode: ev.course.code,
          },
        }))
        setEvents(mapped)
      })
  }, [])

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

  const prevTimeline = () => setDate(d => addDays(d, -14))
  const nextTimeline = () => setDate(d => addDays(d, 14))

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>

        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setMode('calendar')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'calendar' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={() => setMode('timeline')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'timeline' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Rows3 className="h-4 w-4" />
            Timeline
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 p-4">
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
              <p className="text-sm font-semibold text-gray-700">{format(timelineDays[0], 'd MMM')} - {format(timelineDays[timelineDays.length - 1], 'd MMM yyyy')}</p>
              <div className="inline-flex gap-2">
                <button onClick={prevTimeline} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Prev</button>
                <button onClick={() => setDate(new Date())} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Today</button>
                <button onClick={nextTimeline} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Next</button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-lg border border-gray-200">
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-14 border-b border-gray-200 bg-gray-50">
                  {timelineDays.map(day => (
                    <div key={day.toISOString()} className="px-3 py-2 text-center">
                      <p className="text-xs text-gray-500">{format(day, 'EEE')}</p>
                      <p className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-800'}`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-14">
                  {eventsByDay.map(({ day, items }) => (
                    <div key={day.toISOString()} className="min-h-[420px] border-r border-gray-100 p-2 last:border-r-0">
                      <div className="space-y-2">
                        {items.length === 0 ? (
                          <div className="rounded-md border border-dashed border-gray-200 p-2 text-center text-xs text-gray-400">No events</div>
                        ) : (
                          items.map(ev => (
                            <button
                              key={ev.id}
                              onClick={() => router.push(`/events/${ev.id}`)}
                              className={`w-full rounded-md border p-2 text-left transition ${
                                isBefore(ev.start, new Date()) ? 'opacity-60' : 'opacity-100'
                              }`}
                              style={{ borderColor: ev.resource.color + '44', backgroundColor: ev.resource.color + '14' }}
                            >
                              <p className="truncate text-xs font-semibold text-gray-900">{ev.title}</p>
                              <p className="mt-0.5 truncate text-[11px] text-gray-600">{ev.resource.courseCode ?? ev.resource.courseName}</p>
                              <p className="mt-1 text-[11px] text-gray-500">{ev.allDay ? 'All day' : format(ev.start, 'HH:mm')}</p>
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
