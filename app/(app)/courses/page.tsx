import { headers } from 'next/headers'
import { getCourses } from '@/lib/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, BookOpen, ChevronRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'

export default async function CoursesPage() {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const courses = await getCourses(userId)

  // Group by semester
  const bySemester: Record<string, { semesterName: string; courses: typeof courses }> = {}
  for (const course of courses) {
    const key = course.semester.name
    if (!bySemester[key]) bySemester[key] = { semesterName: key, courses: [] }
    bySemester[key].courses.push(course)
  }
  const semesterGroups = Object.values(bySemester)

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="text-sm text-slate-500 mt-0.5">{courses.length} courses across {semesterGroups.length} semesters</p>
        </div>
        <ButtonLink href="/courses/new">
          <Plus className="h-4 w-4 mr-1.5" />
          New course
        </ButtonLink>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Add your first course to start organizing events."
          actionLabel="Add course"
          actionHref="/courses/new"
        />
      ) : (
        <div className="space-y-6">
          {semesterGroups.map(({ semesterName, courses: semCourses }) => (
            <div key={semesterName}>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{semesterName}</h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {semCourses.map(course => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: course.color + '20', border: `2px solid ${course.color}40` }}
                    >
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: course.color }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{course.name}</p>
                        {course.code && (
                          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{course.code}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{course._count.events} events</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
