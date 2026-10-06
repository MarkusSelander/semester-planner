import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err, isRecordNotFound } from '@/lib/api'
import { getSemesterMeta } from '@/lib/queries'
import { invalidateUserCache } from '@/lib/cache'
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

  const semester = await getSemesterMeta(auth.userId, semesterId)
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

  try {
    const updated = await prisma.semester.update({
      where: { id: semesterId, userId: auth.userId },
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      },
    })
    invalidateUserCache(auth.userId, ['semesters'])
    return ok(updated)
  } catch (error) {
    if (isRecordNotFound(error)) return err('Not found', 404)
    throw error
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ semesterId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { semesterId } = await params

  const { count } = await prisma.semester.deleteMany({ where: { id: semesterId, userId: auth.userId } })
  if (!count) return err('Not found', 404)

  invalidateUserCache(auth.userId)
  return ok({ deleted: true })
}
