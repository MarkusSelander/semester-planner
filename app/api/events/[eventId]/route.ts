import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { createRemindersForEvent, deleteRemindersForEvent } from '@/lib/reminders'
import { TAGS, getEvent } from '@/lib/queries'
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

  const event = await getEvent(auth.userId, eventId)
  if (!event) return err('Not found', 404)

  const reminders = await prisma.reminder.findMany({
    where: { eventId },
    orderBy: { remindAt: 'asc' },
  })
  return ok({ ...event, reminders })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { eventId } = await params

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const existing = await prisma.event.findFirst({ where: { id: eventId, userId: auth.userId } })
  if (!existing) return err('Not found', 404)

  const user = await prisma.user.findUnique({ where: { id: auth.userId } })

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...parsed.data,
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : parsed.data.endAt,
    },
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
    },
  })

  // If type or startAt changed, recreate reminders
  if (parsed.data.type || parsed.data.startAt) {
    await deleteRemindersForEvent(eventId)
    await createRemindersForEvent(updated, user?.emailReminders ?? true)
  }

  revalidateTag(TAGS.events(auth.userId), { expire: 0 })
  return ok(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { eventId } = await params

  const existing = await prisma.event.findFirst({ where: { id: eventId, userId: auth.userId } })
  if (!existing) return err('Not found', 404)

  await prisma.event.delete({ where: { id: eventId } })
  revalidateTag(TAGS.events(auth.userId), { expire: 0 })
  return ok({ deleted: true })
}
