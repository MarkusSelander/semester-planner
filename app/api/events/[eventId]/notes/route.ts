import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { invalidateUserCache } from '@/lib/cache'
import { z } from 'zod'

const Schema = z.object({ notes: z.string().nullable() })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { eventId } = await params

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const { count } = await prisma.event.updateMany({
    where: { id: eventId, userId: auth.userId },
    data: { notes: parsed.data.notes },
  })
  if (!count) return err('Not found', 404)

  invalidateUserCache(auth.userId, ['events'])
  return ok({ id: eventId, notes: parsed.data.notes })
}
