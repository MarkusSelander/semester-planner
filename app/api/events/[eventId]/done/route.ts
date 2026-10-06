import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { invalidateUserCache } from '@/lib/cache'

export async function PATCH(_: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { eventId } = await params

  // Ownership check and toggle in one round trip; SET expressions see the pre-update row.
  const rows = await prisma.$queryRaw<{ id: string; isDone: boolean; doneAt: Date | null }[]>`
    UPDATE events
    SET "isDone"    = NOT "isDone",
        "doneAt"    = CASE WHEN "isDone" THEN NULL ELSE now() END,
        "updatedAt" = now()
    WHERE id = ${eventId} AND "userId" = ${auth.userId}
    RETURNING id, "isDone", "doneAt"
  `
  if (!rows.length) return err('Not found', 404)

  invalidateUserCache(auth.userId, ['events'])
  return ok(rows[0])
}
