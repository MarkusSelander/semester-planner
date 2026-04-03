import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'

export async function GET(_: NextRequest, { params }: { params: Promise<{ semesterId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { semesterId } = await params

  const courses = await prisma.course.findMany({
    where: { semesterId, userId: auth.userId },
    include: { _count: { select: { events: true } } },
    orderBy: { name: 'asc' },
  })
  return ok(courses)
}
