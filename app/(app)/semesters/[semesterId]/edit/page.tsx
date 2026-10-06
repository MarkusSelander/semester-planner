import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getSemesterMeta } from '@/lib/queries'
import { EditSemesterForm } from './EditSemesterForm'

export default async function EditSemesterPage({ params }: { params: Promise<{ semesterId: string }> }) {
  const [{ semesterId }, hdrs] = await Promise.all([params, headers()])
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const semester = await getSemesterMeta(userId, semesterId)
  if (!semester) notFound()

  return (
    <EditSemesterForm
      semester={{
        id: semester.id,
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate,
      }}
    />
  )
}
