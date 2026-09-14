import { NextRequest } from 'next/server'
import { getAuthUserId, ok, err } from '@/lib/api'
import { getCourseMeta, getCourseEvents } from '@/lib/queries'

export async function GET(_: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { courseId } = await params

  const course = await getCourseMeta(auth.userId, courseId)
  if (!course) return err('Not found', 404)

  const events = await getCourseEvents(auth.userId, courseId)
  return ok(events)
}
