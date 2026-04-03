import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { TAGS } from '@/lib/queries'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { courseId } = await params

  const course = await prisma.course.findFirst({
    where: { id: courseId, userId: auth.userId },
    include: {
      semester: true,
      events: { orderBy: { startAt: 'asc' } },
      _count: { select: { events: true } },
    },
  })
  if (!course) return err('Not found', 404)
  return ok(course)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { courseId } = await params

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const existing = await prisma.course.findFirst({ where: { id: courseId, userId: auth.userId } })
  if (!existing) return err('Not found', 404)

  const updated = await prisma.course.update({ where: { id: courseId }, data: parsed.data })
  revalidateTag(TAGS.courses(auth.userId), { expire: 0 })
  return ok(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { courseId } = await params

  const existing = await prisma.course.findFirst({ where: { id: courseId, userId: auth.userId } })
  if (!existing) return err('Not found', 404)

  await prisma.course.delete({ where: { id: courseId } })
  revalidateTag(TAGS.courses(auth.userId), { expire: 0 })
  revalidateTag(TAGS.semesters(auth.userId), { expire: 0 })
  revalidateTag(TAGS.events(auth.userId), { expire: 0 })
  return ok({ deleted: true })
}
