import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'

export async function GET(_: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { courseId } = await params

  const course = await prisma.course.findFirst({ where: { id: courseId, userId: auth.userId } })
  if (!course) return err('Not found', 404)

  const events = await prisma.event.findMany({
    where: { courseId, userId: auth.userId },
    orderBy: { startAt: 'asc' },
  })
  return ok(events)
}
