import { headers } from 'next/headers'
import { getSemester } from '@/lib/queries'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus, Upload, Edit, CalendarArrowDown, BookOpen, ListChecks } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CourseBadge } from '@/components/shared/CourseBadge'
import { BackLink } from '@/components/shared/BackLink'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDateOnly, formatEvent } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'

export default async function SemesterDetailPage({ params }: { params: Promise<{ semesterId: string }> }) {
  const { semesterId } = await params
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')
  const timeZone = await getRequestTimezone()

  const semester = await getSemester(userId, semesterId)
  if (!semester) notFound()

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <BackLink href="/semesters">All semesters</BackLink>

      <div className="flex items-start justify-between mt-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{semester.name}</h1>
          <p className="text-sm text-slate-500 mt-1 tabular-nums">
            {formatDateOnly(semester.startDate, 'd MMM yyyy')} – {formatDateOnly(semester.endDate, 'd MMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/api/export/ics?semesterId=${semesterId}`} variant="outline" size="sm">
            <CalendarArrowDown className="h-4 w-4 mr-1" />
            Export
          </ButtonLink>
          <ButtonLink href={`/semesters/${semesterId}/import`} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Import PDF
          </ButtonLink>
          <ButtonLink href={`/semesters/${semesterId}/edit`} variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Courses</CardTitle>
              <ButtonLink href={`/courses/new?semesterId=${semesterId}`} size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </ButtonLink>
            </div>
          </CardHeader>
          <CardContent>
            {semester.courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Add a course to start organizing events for this semester."
                actionLabel="Add course"
                actionHref={`/courses/new?semesterId=${semesterId}`}
                compact
              />
            ) : (
              <div className="space-y-2">
                {semester.courses.map(course => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <CourseBadge name={course.name} code={course.code} color={course.color} />
                    <span className="text-xs text-slate-400">{course._count.events} events</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Events</CardTitle>
              <Link href={`/list?semesterId=${semesterId}`} className="text-sm text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {semester.events.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No upcoming events"
                description="Add an event or import a PDF to fill this semester."
                actionLabel="Add event"
                actionHref={`/events/new?semesterId=${semesterId}`}
                compact
              />
            ) : (
              <div className="space-y-2">
                {semester.events.map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: event.course.color }} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-500">{event.isAllDay ? formatEvent(event.startAt, 'd MMM', timeZone, true) : formatEvent(event.startAt, 'd MMM · HH:mm', timeZone)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
