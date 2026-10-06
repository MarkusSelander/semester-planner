import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getCourses, getSemesterMeta } from '@/lib/queries'
import { ImportPdfForm } from './ImportPdfForm'

export default async function ImportPdfPage({ params }: { params: Promise<{ semesterId: string }> }) {
  const [{ semesterId }, hdrs] = await Promise.all([params, headers()])
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const [semester, courses] = await Promise.all([
    getSemesterMeta(userId, semesterId),
    getCourses(userId, semesterId),
  ])
  if (!semester) notFound()

  return (
    <ImportPdfForm
      semesterId={semesterId}
      semesterName={semester.name}
      courses={courses.map(c => ({ id: c.id, name: c.name, code: c.code }))}
    />
  )
}
