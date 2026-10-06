import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err, isRecordNotFound } from '@/lib/api'
import { getCourseMeta } from '@/lib/queries'
import { invalidateUserCache } from '@/lib/cache'
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

  const course = await getCourseMeta(auth.userId, courseId)
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

  try {
    const updated = await prisma.course.update({
      where: { id: courseId, userId: auth.userId },
      data: parsed.data,
    })
    invalidateUserCache(auth.userId, ['courses'])
    return ok(updated)
  } catch (error) {
    if (isRecordNotFound(error)) return err('Not found', 404)
    throw error
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { courseId } = await params

  const { count } = await prisma.course.deleteMany({ where: { id: courseId, userId: auth.userId } })
  if (!count) return err('Not found', 404)

  invalidateUserCache(auth.userId)
  return ok({ deleted: true })
}
