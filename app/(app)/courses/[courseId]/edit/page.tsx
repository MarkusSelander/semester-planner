import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getCourseMeta } from '@/lib/queries'
import { EditCourseForm } from './EditCourseForm'

export default async function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const [{ courseId }, hdrs] = await Promise.all([params, headers()])
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const course = await getCourseMeta(userId, courseId)
  if (!course) notFound()

  return (
    <EditCourseForm
      course={{ id: course.id, name: course.name, code: course.code, color: course.color }}
    />
  )
}
