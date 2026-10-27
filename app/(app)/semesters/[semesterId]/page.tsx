import { headers } from 'next/headers'
import { getSemester } from '@/lib/queries'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus, Upload, Edit, CalendarArrowDown } from 'lucide-react'
import { ButtonAnchor, ButtonLink } from '@/components/ui/button'
import { CourseBadge } from '@/components/shared/CourseBadge'
import { formatDateOnly, formatEvent } from '@/lib/dates'
import { getRequestTimezone } from '@/lib/dates.server'
import { BackLink } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'

export default async function SemesterDetailPage({ params }: { params: Promise<{ semesterId: string }> }) {
  const { semesterId } = await params
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')
  const timeZone = await getRequestTimezone()

  const semester = await getSemester(userId, semesterId)
  if (!semester) notFound()

  return (
    <PageShell width="wide">
      <BackLink href="/semesters">All semesters</BackLink>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="page-kicker">Semester</p>
          <h1 className="page-title">{semester.name}</h1>
          <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
            {formatDateOnly(semester.startDate, 'd MMM yyyy')} – {formatDateOnly(semester.endDate, 'd MMM yyyy')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonAnchor
            href={`/api/export/ics?semesterId=${semesterId}`}
            download
            variant="outline"
            size="sm"
          >
            <CalendarArrowDown className="h-4 w-4 mr-1" />
            Export
          </ButtonAnchor>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-sm border border-border/80 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg">Courses</h2>
            <ButtonLink href={`/courses/new?semesterId=${semesterId}`} size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" />
              Add
            </ButtonLink>
          </div>
          {semester.courses.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No courses yet</p>
          ) : (
            <div className="space-y-1">
              {semester.courses.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="flex items-center justify-between rounded-sm px-2 py-2 hover:bg-muted/50"
                >
                  <CourseBadge name={course.name} code={course.code} color={course.color} />
                  <span className="font-mono text-[11px] text-muted-foreground">{course._count.events} events</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-sm border border-border/80 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg">Upcoming events</h2>
            <Link href={`/list?semesterId=${semesterId}`} className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          {semester.events.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No upcoming events</p>
          ) : (
            <div className="space-y-1">
              {semester.events.map(event => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-start gap-3 rounded-sm px-2 py-2 hover:bg-muted/50"
                >
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: event.course.color }} />
                  <div>
                    <p className="text-sm">{event.title}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {event.isAllDay
                        ? formatEvent(event.startAt, 'd MMM', timeZone, true)
                        : formatEvent(event.startAt, 'd MMM · HH:mm', timeZone)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  )
}
