import { headers } from 'next/headers'
import { getTimelineEvents } from '@/lib/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { formatEvent, formatMonthHeading, formatTz, monthKeyFor } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { eventTypeLabel, eventTypeStyle } from '@/lib/event-display'
import { EmptyState } from '@/components/shared/EmptyState'
import { TimelineScroller } from './TimelineScroller'

export default async function TimelinePage() {
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')

  const timeZone = await getRequestTimezone()
  const now = new Date()

  const events = await getTimelineEvents(userId, 500)

  const groups: Record<string, typeof events> = {}
  for (const ev of events) {
    const key = monthKeyFor(ev.startAt, timeZone, ev.isAllDay)
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }

  const monthKeys = Object.keys(groups).sort()
  const currentMonthKey = formatTz(now, 'yyyy-MM', timeZone)

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <TimelineScroller currentMonthKey={currentMonthKey} />
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Timeline</h1>

      {monthKeys.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events"
          description="Add events or import a PDF schedule to build your timeline."
          actionLabel="Add event"
          actionHref="/events/new"
          secondaryActionLabel="Import PDF"
          secondaryActionHref="/semesters"
        />
      ) : (
        <div className="relative">
          <div className="absolute left-[7.5rem] top-0 bottom-0 w-px bg-slate-200" />

          <div className="space-y-0">
            {monthKeys.map(monthKey => {
              const monthEvents = groups[monthKey]

              return (
                <div key={monthKey} id={monthKey} className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-28 text-right">
                      <span className="text-sm font-bold text-slate-800">
                        {formatMonthHeading(monthKey, 'MMMM')}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {formatMonthHeading(monthKey, 'yyyy')}
                      </span>
                    </div>
                    <div className="h-3 w-3 rounded-full bg-slate-800 border-2 border-white ring-2 ring-slate-200 z-10" />
                  </div>

                  <div className="space-y-2">
                    {monthEvents.map(ev => {
                      const styles = eventTypeStyle(ev.type)
                      return (
                        <div key={ev.id} className={`flex items-start gap-4 ${ev.startAt < now ? 'opacity-50' : ''}`}>
                          <div className="w-28 text-right flex-shrink-0 pt-1">
                            <span className="text-xs text-slate-500">
                              {formatEvent(ev.startAt, 'd MMM', timeZone, ev.isAllDay)}
                            </span>
                            {!ev.isAllDay && (
                              <span className="block text-xs text-slate-400">
                                {formatEvent(ev.startAt, 'HH:mm', timeZone)}
                              </span>
                            )}
                          </div>

                          <div className="flex-shrink-0 mt-1.5 z-10">
                            <div className={`h-3 w-3 rounded-full border-2 border-white ${styles.dot}`} />
                          </div>

                          <Link
                            href={`/events/${ev.id}`}
                            className="flex-1 min-w-0 mb-1 group"
                          >
                            <div className="rounded-lg border border-slate-100 bg-white p-3 hover:border-slate-300 hover:shadow-sm transition-all">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-medium group-hover:text-indigo-600 transition-colors ${ev.isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  {ev.title}
                                </p>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${styles.badge}`}>
                                  {eventTypeLabel(ev.type)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="h-2 w-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: ev.course.color }}
                                />
                                <p className="text-xs text-slate-400">
                                  {ev.course.code ?? ev.course.name} · {ev.semester.name}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
