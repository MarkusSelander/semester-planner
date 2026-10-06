import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err, isRecordNotFound } from '@/lib/api'
import { createRemindersForEvent, deleteRemindersForEvent } from '@/lib/reminders'
import { getEvent } from '@/lib/queries'
import { invalidateUserCache } from '@/lib/cache'
import { z } from 'zod'

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER']).optional(),
  startAt: z.string().datetime({ offset: true }).optional(),
  endAt: z.string().datetime({ offset: true }).optional().nullable(),
  isAllDay: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  location: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { eventId } = await params

  const [event, reminders] = await Promise.all([
    getEvent(auth.userId, eventId),
    prisma.reminder.findMany({
      where: { eventId, userId: auth.userId },
      orderBy: { remindAt: 'asc' },
    }),
  ])
  if (!event) return err('Not found', 404)

  return ok({ ...event, reminders })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { eventId } = await params

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const remindersChanged = Boolean(parsed.data.type || parsed.data.startAt)
  let updated, user
  try {
    ;[updated, user] = await Promise.all([
      prisma.event.update({
        where: { id: eventId, userId: auth.userId },
        data: {
          ...parsed.data,
          startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
          endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : parsed.data.endAt,
        },
        include: {
          course: { select: { id: true, name: true, code: true, color: true } },
        },
      }),
      remindersChanged
        ? prisma.user.findUnique({ where: { id: auth.userId }, select: { emailReminders: true } })
        : null,
    ])
  } catch (error) {
    if (isRecordNotFound(error)) return err('Not found', 404)
    throw error
  }

  // If type or startAt changed, recreate reminders
  if (remindersChanged) {
    await deleteRemindersForEvent(eventId)
    await createRemindersForEvent(updated, user?.emailReminders ?? true)
  }

  invalidateUserCache(auth.userId, ['events'])
  return ok(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { eventId } = await params

  const { count } = await prisma.event.deleteMany({ where: { id: eventId, userId: auth.userId } })
  if (!count) return err('Not found', 404)

  invalidateUserCache(auth.userId)
  return ok({ deleted: true })
}
