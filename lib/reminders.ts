import { prisma } from '@/lib/prisma'
import { EventType, Event } from '@prisma/client'

type ReminderOffset = { days: number }

function getOffsetsForType(type: EventType): ReminderOffset[] {
  switch (type) {
    case 'EXAM':
      return [{ days: 7 }, { days: 3 }, { days: 1 }]
    case 'ASSIGNMENT':
    case 'PROJECT':
      return [{ days: 3 }, { days: 1 }]
    case 'EXERCISE':
      return [{ days: 1 }]
    default:
      return []
  }
}

export async function createRemindersForEvent(
  event: Pick<Event, 'id' | 'userId' | 'type' | 'startAt'>,
  emailReminders: boolean
) {
  if (!emailReminders) return

  const offsets = getOffsetsForType(event.type)
  if (offsets.length === 0) return

  const now = new Date()
  const remindersToCreate = offsets
    .map(({ days }) => {
      const remindAt = new Date(event.startAt)
      remindAt.setDate(remindAt.getDate() - days)
      return { remindAt, days }
    })
    .filter(({ remindAt }) => remindAt > now)

  if (remindersToCreate.length === 0) return

  await prisma.reminder.createMany({
    data: remindersToCreate.map(({ remindAt, days }) => ({
      eventId: event.id,
      userId: event.userId,
      remindAt,
      offsetDays: days,
    })),
    skipDuplicates: true,
  })
}

export async function deleteRemindersForEvent(eventId: string) {
  await prisma.reminder.deleteMany({
    where: { eventId, sent: false },
  })
}
