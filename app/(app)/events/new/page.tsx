import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCourses, getSemesters } from '@/lib/queries'
import { getRequestTimezone } from '@/lib/dates.server'
import { NewEventForm } from './NewEventForm'

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ semesterId?: string; courseId?: string }>
}) {
  const [hdrs, sp] = await Promise.all([headers(), searchParams])
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const [semesters, courses, timeZone] = await Promise.all([
    getSemesters(userId),
    getCourses(userId),
    getRequestTimezone(),
  ])
  const initialSemesterId =
    sp.semesterId ?? courses.find(c => c.id === sp.courseId)?.semesterId ?? ''

  return (
    <NewEventForm
      semesters={semesters.map(s => ({ id: s.id, name: s.name }))}
      allCourses={courses.map(c => ({ id: c.id, name: c.name, code: c.code, semesterId: c.semesterId }))}
      initialSemesterId={initialSemesterId}
      initialCourseId={sp.courseId ?? ''}
      timeZone={timeZone}
    />
  )
}
