import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Upload, Edit, CalendarArrowDown } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CourseBadge } from '@/components/shared/CourseBadge'
import { format } from 'date-fns'

export default async function SemesterDetailPage({ params }: { params: Promise<{ semesterId: string }> }) {
  const { semesterId } = await params
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')

  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId },
    include: {
      courses: {
        include: { _count: { select: { events: true } } },
        orderBy: { name: 'asc' },
      },
      events: {
        where: { isDone: false, startAt: { gte: new Date() } },
        include: { course: { select: { name: true, code: true, color: true } } },
        orderBy: { startAt: 'asc' },
        take: 10,
      },
      _count: { select: { events: true } },
    },
  })
  if (!semester) notFound()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/semesters" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 w-fit">
        <ArrowLeft className="h-4 w-4" /> All semesters
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{semester.name}</h1>
          <p className="text-sm text-slate-500 mt-1 tabular-nums">
            {format(semester.startDate, 'd MMM yyyy')} – {format(semester.endDate, 'd MMM yyyy')}
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
        {/* Courses */}
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
              <p className="text-sm text-gray-400 text-center py-4">No courses yet</p>
            ) : (
              <div className="space-y-2">
                {semester.courses.map(course => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <CourseBadge name={course.name} code={course.code} color={course.color} />
                    <span className="text-xs text-gray-400">{course._count.events} events</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Events</CardTitle>
              <Link href={`/list?semesterId=${semesterId}`} className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {semester.events.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {semester.events.map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: event.course.color }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">{format(event.startAt, 'd MMM · HH:mm')}</p>
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
