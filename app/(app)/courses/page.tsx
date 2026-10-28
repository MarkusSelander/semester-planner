import { headers } from 'next/headers'
import { getCourses } from '@/lib/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'

export default async function CoursesPage() {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const courses = await getCourses(userId)

  const bySemester: Record<string, { semesterName: string; courses: typeof courses }> = {}
  for (const course of courses) {
    const key = course.semester.name
    if (!bySemester[key]) bySemester[key] = { semesterName: key, courses: [] }
    bySemester[key].courses.push(course)
  }
  const semesterGroups = Object.values(bySemester)

  return (
    <PageShell width="wide">
      <PageHeader
        kicker="Library"
        title="Courses"
        description={`${courses.length} across ${semesterGroups.length} ${semesterGroups.length === 1 ? 'semester' : 'semesters'}`}
        actions={
          <ButtonLink href="/courses/new" size="sm">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            New course
          </ButtonLink>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses"
          description="Add a course to start hanging events on it."
          actionLabel="Add course"
          actionHref="/courses/new"
        />
      ) : (
        <div className="space-y-10">
          {semesterGroups.map(({ semesterName, courses: semCourses }) => (
            <section key={semesterName}>
              <h2 className="page-kicker">{semesterName}</h2>
              <ul className="divide-y divide-border border-t border-border">
                {semCourses.map(course => (
                  <li key={course.id}>
                    <Link
                      href={`/courses/${course.id}`}
                      className="-mx-2 flex min-h-11 items-center gap-4 rounded-sm px-2 py-3.5 transition-colors duration-[var(--duration-micro)] ease-out-quart hover:bg-muted/60 hover:text-primary"
                    >
                      <span className="h-6 w-0.5 shrink-0" style={{ backgroundColor: course.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{course.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {course.code ? `${course.code} · ` : ''}{course._count.events} events
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  )
}
