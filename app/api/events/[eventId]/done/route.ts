import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { TAGS } from '@/lib/queries'

export async function PATCH(_: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { eventId } = await params

  const existing = await prisma.event.findFirst({ where: { id: eventId, userId: auth.userId } })
  if (!existing) return err('Not found', 404)

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      isDone: !existing.isDone,
      doneAt: !existing.isDone ? new Date() : null,
    },
  })
  revalidateTag(TAGS.events(auth.userId), { expire: 0 })
  return ok(updated)
}
