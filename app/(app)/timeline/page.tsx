import { headers } from 'next/headers'
import { getTimelineEvents } from '@/lib/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { TimelineScroller } from './TimelineScroller'

const TYPE_COLORS: Record<string, string> = {
  EXAM: 'bg-red-100 text-red-700 border-red-200',
  ASSIGNMENT: 'bg-orange-100 text-orange-700 border-orange-200',
  PROJECT: 'bg-purple-100 text-purple-700 border-purple-200',
  EXERCISE: 'bg-blue-100 text-blue-700 border-blue-200',
  LECTURE: 'bg-slate-100 text-slate-600 border-slate-200',
  OTHER: 'bg-slate-100 text-slate-500 border-slate-200',
}

const TYPE_DOT: Record<string, string> = {
  EXAM: 'bg-red-500',
  ASSIGNMENT: 'bg-orange-400',
  PROJECT: 'bg-purple-500',
  EXERCISE: 'bg-blue-400',
  LECTURE: 'bg-gray-400',
  OTHER: 'bg-gray-300',
}

export default async function TimelinePage() {
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')

  const now = new Date()

  const events = await getTimelineEvents(userId, 500)

  // Group by month
  const groups: Record<string, typeof events> = {}
  for (const ev of events) {
    const key = format(ev.startAt, 'yyyy-MM')
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }

  const monthKeys = Object.keys(groups).sort()

  const currentMonthKey = format(now, 'yyyy-MM')

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <TimelineScroller currentMonthKey={currentMonthKey} />
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Timeline</h1>

      {monthKeys.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">No events</p>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7.5rem] top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-0">
            {monthKeys.map(monthKey => {
              const monthEvents = groups[monthKey]
              const monthDate = new Date(monthKey + '-01')

              return (
                <div key={monthKey} id={monthKey} className="mb-8">
                  {/* Month header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-28 text-right">
                      <span className="text-sm font-bold text-gray-800">
                        {format(monthDate, 'MMMM')}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {format(monthDate, 'yyyy')}
                      </span>
                    </div>
                    <div className="h-3 w-3 rounded-full bg-gray-800 border-2 border-white ring-2 ring-gray-200 z-10" />
                  </div>

                  {/* Events in this month */}
                  <div className="space-y-2">
                    {monthEvents.map(ev => (
                      <div key={ev.id} className={`flex items-start gap-4 ${ev.startAt < now ? 'opacity-50' : ''}`}>
                        <div className="w-28 text-right flex-shrink-0 pt-1">
                          <span className="text-xs text-slate-500">
                            {format(ev.startAt, 'd MMM')}
                          </span>
                          {!ev.isAllDay && (
                            <span className="block text-xs text-slate-400">
                              {format(ev.startAt, 'HH:mm')}
                            </span>
                          )}
                        </div>

                        {/* Dot on the line */}
                        <div className="flex-shrink-0 mt-1.5 z-10">
                          <div className={`h-3 w-3 rounded-full border-2 border-white ${TYPE_DOT[ev.type] ?? 'bg-gray-300'}`} />
                        </div>

                        {/* Event card */}
                        <Link
                          href={`/events/${ev.id}`}
                          className="flex-1 min-w-0 mb-1 group"
                        >
                          <div className="rounded-lg border border-slate-100 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-medium group-hover:text-blue-600 transition-colors ${ev.isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {ev.title}
                              </p>
                              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${TYPE_COLORS[ev.type] ?? ''}`}>
                                {ev.type}
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
                    ))}
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
