import { headers } from 'next/headers'
import { getActiveSemesters, getUpcomingEvents } from '@/lib/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, Plus, Upload, ArrowRight, Sparkles, Clock3, AlertTriangle, Flag } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import {
  dateLabel,
  differenceInDaysTz,
  formatDateOnly,
  formatEvent,
  formatTz,
  isTodayTz,
} from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { eventTypeLabel, eventTypeStyle } from '@/lib/event-display'

export default async function DashboardPage() {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')
  const user = { id: userId, user_metadata: { full_name: hdrs.get('x-user-name') } }

  const [semesters, upcomingEvents] = await Promise.all([
    getActiveSemesters(user.id),
    getUpcomingEvents(user.id),
  ])

  const timeZone = await getRequestTimezone()

  function eventDateLabel(date: Date, isAllDay?: boolean) {
    return dateLabel(date, timeZone, isAllDay)
  }

  const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? 'there'
  const hour = Number(formatTz(new Date(), 'H', timeZone))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const nextEvent = upcomingEvents[0] ?? null
  const todayEvents = upcomingEvents.filter(e => isTodayTz(e.startAt, timeZone))
  const thisWeekEvents = upcomingEvents.filter(e => differenceInDaysTz(e.startAt, timeZone) <= 7)
  const priorityQueue = upcomingEvents.filter(e => e.type === 'EXAM' || e.type === 'ASSIGNMENT' || e.type === 'PROJECT')

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1 font-medium">{formatTz(new Date(), 'EEEE, d MMMM yyyy', timeZone)}</p>
          <h1 className="text-3xl font-bold text-slate-900">{greeting}, {firstName}</h1>
          <p className="text-sm text-slate-500 mt-1">Plan your week by priority and due date.</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/semesters/new" variant="outline" size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New semester
          </ButtonLink>
          <ButtonLink href="/events/new" size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add event
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Focus now</h2>
              <Link href="/list" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                Open event list <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {!nextEvent ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-500 mb-2">No upcoming events right now.</p>
                <ButtonLink href="/events/new" size="sm">Create next event</ButtonLink>
              </div>
            ) : (
              <Link href={`/events/${nextEvent.id}`} className="block rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-1.5 rounded-full ${eventTypeStyle(nextEvent.type).bar}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500 mb-1">Next up</p>
                    <p className="text-lg font-semibold text-slate-900 truncate">{nextEvent.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${eventTypeStyle(nextEvent.type).badge}`}>{eventTypeLabel(nextEvent.type)}</span>
                      <span className="text-xs text-slate-500">{nextEvent.course.code ?? nextEvent.course.name}</span>
                      <span className="text-xs text-slate-400">{nextEvent.isAllDay ? formatEvent(nextEvent.startAt, 'd MMM', timeZone, true) : formatEvent(nextEvent.startAt, 'd MMM · HH:mm', timeZone)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Weekly agenda</h2>
              <span className="text-xs text-slate-500">Next 7 days</span>
            </div>
            {thisWeekEvents.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">No events this week.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {thisWeekEvents.map(event => {
                  const styles = eventTypeStyle(event.type)
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`h-7 w-1 rounded-full ${styles.bar}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{event.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{event.course.code ?? event.course.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500">{eventDateLabel(event.startAt, event.isAllDay)}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>{eventTypeLabel(event.type)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div className="xl:col-span-4 space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <Clock3 className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Today</h2>
            </div>
            {todayEvents.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-500">No events today.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayEvents.map(event => (
                  <Link key={event.id} href={`/events/${event.id}`} className="block px-4 py-3 hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-medium text-slate-900 truncate">{event.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{event.isAllDay ? 'All day' : formatEvent(event.startAt, 'HH:mm', timeZone)} · {event.course.code ?? event.course.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <Flag className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Priority queue</h2>
            </div>
            {priorityQueue.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-500">No high-priority tasks right now.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {priorityQueue.slice(0, 6).map(event => (
                  <Link key={event.id} href={`/events/${event.id}`} className="block px-4 py-3 hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-medium text-slate-900 truncate">{event.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{eventDateLabel(event.startAt, event.isAllDay)} · {eventTypeLabel(event.type)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-800">Semester context</h2>
              </div>
              <Link href="/semesters" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">All</Link>
            </div>
            <div className="p-2">
              {semesters.length === 0 ? (
                <p className="px-2 py-4 text-sm text-slate-500">No active semesters.</p>
              ) : (
                semesters.map(semester => (
                  <Link key={semester.id} href={`/semesters/${semester.id}`} className="block rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-medium text-slate-900 truncate">{semester.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDateOnly(semester.startDate, 'd MMM')} - {formatDateOnly(semester.endDate, 'd MMM yyyy')}</p>
                    {semester.courses.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {semester.courses.slice(0, 6).map((c: { id: string; color: string }) => (
                          <span key={c.id} className="h-1.5 w-6 rounded-full" style={{ backgroundColor: c.color }} />
                        ))}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-700 p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">AI Import</p>
            </div>
            <p className="text-sm font-semibold mb-1">Import schedule from PDF</p>
            <p className="text-xs text-indigo-300 mb-4 leading-relaxed">Automatically extract classes, assignments, and deadlines into your timeline.</p>
            <ButtonLink href="/semesters" size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50 border-0 shadow-sm">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import PDF
            </ButtonLink>
          </section>

          {priorityQueue.length > 0 && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Attention needed</p>
                  <p className="text-xs text-amber-700 mt-1">You have priority deadlines coming up. Handle these before lower-priority tasks.</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
