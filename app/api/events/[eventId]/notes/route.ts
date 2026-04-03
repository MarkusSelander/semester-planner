import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { z } from 'zod'

const Schema = z.object({ notes: z.string().nullable() })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error
  const { eventId } = await params

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const existing = await prisma.event.findFirst({ where: { id: eventId, userId: auth.userId } })
  if (!existing) return err('Not found', 404)

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { notes: parsed.data.notes },
  })
  return ok(updated)
}
