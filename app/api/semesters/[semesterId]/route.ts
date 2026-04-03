import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { TAGS } from '@/lib/queries'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ semesterId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { semesterId } = await params

  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId: auth.userId },
    include: {
      courses: { orderBy: { name: 'asc' } },
      _count: { select: { events: true } },
    },
  })
  if (!semester) return err('Not found', 404)
  return ok(semester)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ semesterId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { semesterId } = await params

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const existing = await prisma.semester.findFirst({ where: { id: semesterId, userId: auth.userId } })
  if (!existing) return err('Not found', 404)

  const updated = await prisma.semester.update({
    where: { id: semesterId },
    data: {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    },
  })
  revalidateTag(TAGS.semesters(auth.userId), { expire: 0 })
  return ok(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ semesterId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { semesterId } = await params

  const existing = await prisma.semester.findFirst({ where: { id: semesterId, userId: auth.userId } })
  if (!existing) return err('Not found', 404)

  await prisma.semester.delete({ where: { id: semesterId } })
  revalidateTag(TAGS.semesters(auth.userId), { expire: 0 })
  revalidateTag(TAGS.courses(auth.userId), { expire: 0 })
  revalidateTag(TAGS.events(auth.userId), { expire: 0 })
  return ok({ deleted: true })
}
