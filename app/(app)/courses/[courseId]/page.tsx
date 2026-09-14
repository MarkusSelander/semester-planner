import { headers } from 'next/headers'
import { getCourse } from '@/lib/queries'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, CalendarDays, CheckCircle2, Clock3 } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { isBefore } from 'date-fns'
import {
  dateLabel,
  formatEvent,
  formatMonthHeading,
  isTodayTz,
  monthKeyFor,
} from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'

const typeColors: Record<string, string> = {
  EXAM: 'bg-red-100 text-red-700',
  ASSIGNMENT: 'bg-orange-100 text-orange-700',
  PROJECT: 'bg-purple-100 text-purple-700',
  EXERCISE: 'bg-blue-100 text-blue-700',
  LECTURE: 'bg-gray-100 text-gray-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

function eventStatus(event: { isDone: boolean; startAt: Date }, timeZone: string) {
  if (event.isDone) return { label: 'Done', cls: 'bg-emerald-100 text-emerald-700' }
  if (isTodayTz(event.startAt, timeZone)) return { label: 'Today', cls: 'bg-blue-100 text-blue-700' }
  if (isBefore(event.startAt, new Date())) return { label: 'Overdue', cls: 'bg-red-100 text-red-700' }
  return { label: 'Upcoming', cls: 'bg-slate-100 text-slate-700' }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')
  const timeZone = await getRequestTimezone()

  const course = await getCourse(userId, courseId)
  if (!course) notFound()

  const now = new Date()
  const doneEvents = course.events.filter(event => event.isDone)
  const upcomingEvents = course.events.filter(event => event.startAt >= now && !event.isDone)
  const overdueEvents = course.events.filter(event => event.startAt < now && !event.isDone)

  const eventsByMonth = course.events.reduce<Record<string, typeof course.events>>((acc, event) => {
    const key = monthKeyFor(event.startAt, timeZone, event.isAllDay)
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {})
  const monthKeys = Object.keys(eventsByMonth).sort()

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-4 w-4" /> All courses
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-3.5 w-3.5 rounded-full ring-4 ring-white shadow-sm" style={{ backgroundColor: course.color }} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Course</p>
              <h1 className="text-3xl font-bold leading-tight text-slate-900">{course.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                {course.code && <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-600">{course.code}</span>}
                <span>{course.semester.name}</span>
              </div>
            </div>
          </div>
          <ButtonLink href={`/courses/${courseId}/edit`} variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </ButtonLink>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 lg:col-span-1">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Needs attention</p>
            {overdueEvents.length === 0 ? (
              <p className="text-sm text-emerald-600">No overdue events</p>
            ) : (
              <div className="space-y-1.5">
                {overdueEvents.slice(0, 3).map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700 hover:border-red-300 hover:bg-red-100/70"
                  >
                    <p className="truncate font-medium">{event.title}</p>
                    <p className="text-red-600">{dateLabel(event.startAt, timeZone, event.isAllDay)}</p>
                  </Link>
                ))}
                {overdueEvents.length > 3 && (
                  <p className="text-xs text-slate-500">+ {overdueEvents.length - 3} more</p>
                )}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 lg:col-span-1">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Upcoming</p>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No upcoming events</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingEvents.slice(0, 3).map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="truncate font-medium">{event.title}</p>
                    <p className="text-slate-500">{dateLabel(event.startAt, timeZone, event.isAllDay)}</p>
                  </Link>
                ))}
                {upcomingEvents.length > 3 && (
                  <p className="text-xs text-slate-500">+ {upcomingEvents.length - 3} more</p>
                )}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 lg:col-span-1">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Completed</p>
            {doneEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No completed events</p>
            ) : (
              <div className="space-y-1.5">
                {doneEvents.slice(0, 3).map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="truncate font-medium line-through text-slate-500">{event.title}</p>
                    <p className="text-slate-500">{dateLabel(event.startAt, timeZone, event.isAllDay)}</p>
                  </Link>
                ))}
                {doneEvents.length > 3 && (
                  <p className="text-xs text-slate-500">+ {doneEvents.length - 3} more</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-700">Timeline</h2>
          </div>
          <span className="text-xs text-slate-500">{course.events.length} items</span>
        </div>

        {course.events.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">No events for this course yet</p>
        ) : (
          <div className="p-3 md:p-4 space-y-6">
            {monthKeys.map(monthKey => {
              const monthEvents = eventsByMonth[monthKey]
              return (
                <section key={monthKey} className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
                    {formatMonthHeading(monthKey, 'MMMM yyyy')}
                  </h3>

                  <div className="space-y-2">
                    {monthEvents.map(event => {
                      const status = eventStatus(event, timeZone)
                      return (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className={`group block rounded-xl border p-3 transition-all hover:border-slate-300 hover:shadow-sm ${
                          event.isDone ? 'border-slate-200 bg-slate-50/70 opacity-80' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`text-sm font-medium ${event.isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {event.title}
                              </p>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${typeColors[event.type] ?? ''}`}>
                                {event.type}
                              </span>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${status.cls}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3 w-3" />
                                {event.isAllDay
                                  ? formatEvent(event.startAt, 'd MMM yyyy', timeZone, true)
                                  : formatEvent(event.startAt, 'd MMM yyyy · HH:mm', timeZone)}
                              </span>
                              {event.isDone && (
                                <span className="inline-flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Done
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
