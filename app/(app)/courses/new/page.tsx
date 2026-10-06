import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSemesters } from '@/lib/queries'
import { NewCourseForm } from './NewCourseForm'

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ semesterId?: string }>
}) {
  const [hdrs, sp] = await Promise.all([headers(), searchParams])
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const semesters = await getSemesters(userId)

  return (
    <NewCourseForm
      semesters={semesters.map(s => ({ id: s.id, name: s.name }))}
      initialSemesterId={sp.semesterId ?? ''}
    />
  )
}
