import { NextRequest } from 'next/server'
import { getAuthUserId, ok } from '@/lib/api'
import { getCourses } from '@/lib/queries'

export async function GET(_: NextRequest, { params }: { params: Promise<{ semesterId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { semesterId } = await params

  const courses = await getCourses(auth.userId, semesterId)
  return ok(courses)
}
