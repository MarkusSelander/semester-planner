'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, isSameDay, startOfDay, isBefore } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { CalendarDays, Rows3 } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { isActionRequired, mustHandIn, TypeBadge } from '@/components/event-type'
import { getBrowserTimezone, toDateInputValue } from '@/lib/dates'
import { PageHeader } from '@/components/layout/PageHeader'
import { DateRail } from '@/components/layout/DateRail'

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

type CalendarMode = 'calendar' | 'timeline'

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
      color: '#f7f1ea',
      borderRadius: '2px',
      fontSize: '0.7rem',
      padding: '1px 5px',
      boxShadow: isActionRequired(event.resource.type)
        ? 'inset 3px 0 0 #1f1b16'
        : undefined,
      opacity: isActionRequired(event.resource.type) ? 1 : 0.85,
    },
  })

  const CalEventChip = ({ event }: { event: CalEvent }) => (
    <span className="truncate font-mono text-[11px]">{event.title}</span>
  )

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

  const agendaDays = useMemo(() => {
    const start = startOfDay(date)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i)).map(day => ({
      day,
      items: events
        .filter(ev => isSameDay(ev.start, day))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    }))
  }, [events, date])

  const prevTimeline = () => setDate(d => addDays(d, -14))
  const nextTimeline = () => setDate(d => addDays(d, 14))

  return (
    <div className="flex h-full flex-col px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        kicker="Week"
        title="Calendar"
        className="mb-5"
        actions={
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setMode('calendar')}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2 font-mono text-[11px] uppercase tracking-[0.14em] ${
                mode === 'calendar' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
              Month
            </button>
            <button
              onClick={() => setMode('timeline')}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2 font-mono text-[11px] uppercase tracking-[0.14em] ${
                mode === 'timeline' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
              }`}
            >
              <Rows3 className="h-3.5 w-3.5" strokeWidth={1.75} />
              2 weeks
            </button>
          </div>
        }
      />

      <div className="min-h-0 flex-1">
        {mode === 'calendar' ? (
          <>
            <div className="space-y-5 md:hidden">
              {agendaDays.map(({ day, items }) => (
                <DateRail
                  key={day.toISOString()}
                  day={format(day, 'd')}
                  weekday={isSameDay(day, new Date()) ? 'Today' : format(day, 'EEE')}
                >
                  {items.length === 0 ? (
                    <p className="py-1 text-sm text-muted-foreground">Free</p>
                  ) : (
                    <div className="space-y-3">
                      {items.map(ev => (
                        <button
                          key={ev.id}
                          onClick={() => router.push(`/events/${ev.id}`)}
                          className="block w-full text-left"
                        >
                          <p className={`truncate text-sm ${isActionRequired(ev.resource.type) ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {ev.title}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                            {ev.allDay ? 'All day' : format(ev.start, 'HH:mm')} · {ev.resource.courseCode ?? ev.resource.courseName}
                            {mustHandIn(ev.resource.type) ? ' · Hand in' : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </DateRail>
              ))}
            </div>
            <div className="hidden h-full min-h-[32rem] md:block">
              <Calendar
                localizer={localizer}
                events={events}
                view={calendarView}
                onView={setCalendarView}
                date={date}
                onNavigate={setDate}
                eventPropGetter={eventStyleGetter}
                components={{ event: CalEventChip }}
                onSelectEvent={ev => router.push(`/events/${ev.id}`)}
                style={{ height: '100%' }}
                popup
              />
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs tabular-nums text-muted-foreground">
                {format(timelineDays[0], 'd MMM')} – {format(timelineDays[timelineDays.length - 1], 'd MMM yyyy')}
              </p>
              <div className="flex gap-2">
                <button onClick={prevTimeline} className="field-select w-auto px-3">Prev</button>
                <button onClick={() => setDate(new Date())} className="field-select w-auto px-3">Today</button>
                <button onClick={nextTimeline} className="field-select w-auto px-3">Next</button>
              </div>
            </div>

            <div className="md:hidden space-y-5">
              {eventsByDay.map(({ day, items }) => (
                <DateRail
                  key={day.toISOString()}
                  day={format(day, 'd')}
                  weekday={format(day, 'EEE')}
                >
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Free</p>
                  ) : items.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => router.push(`/events/${ev.id}`)}
                      className="mb-3 block w-full text-left last:mb-0"
                    >
                      <p className="truncate text-sm">{ev.title}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {ev.allDay ? 'All day' : format(ev.start, 'HH:mm')} · {ev.resource.courseCode ?? ev.resource.courseName}
                      </p>
                    </button>
                  ))}
                </DateRail>
              ))}
            </div>

            <div className="hidden min-h-0 flex-1 overflow-auto md:block">
              <div className="min-w-[1100px]">
                <div className="grid grid-cols-14 border-b border-border">
                  {timelineDays.map(day => (
                    <div key={day.toISOString()} className="px-2 py-2 text-center">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{format(day, 'EEE')}</p>
                      <p className={`font-heading text-lg tabular-nums ${isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-14">
                  {eventsByDay.map(({ day, items }) => (
                    <div key={day.toISOString()} className="min-h-[420px] border-r border-border p-2 last:border-r-0">
                      <div className="space-y-2">
                        {items.map(ev => {
                          const emphasize = isActionRequired(ev.resource.type)
                          return (
                            <button
                              key={ev.id}
                              onClick={() => router.push(`/events/${ev.id}`)}
                              className={`w-full border-l-2 p-2 text-left transition-opacity duration-200 ${
                                isBefore(ev.start, new Date()) ? 'opacity-50' : ''
                              }`}
                              style={{ borderLeftColor: ev.resource.color }}
                            >
                              <p className={`truncate text-xs ${emphasize ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                {ev.title}
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                {ev.allDay ? 'All day' : format(ev.start, 'HH:mm')}
                              </p>
                              {mustHandIn(ev.resource.type) && <TypeBadge type={ev.resource.type} />}
                            </button>
                          )
                        })}
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
