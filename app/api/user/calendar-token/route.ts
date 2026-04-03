import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { randomUUID } from 'crypto'

export async function GET() {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { calendarToken: true },
  })
  if (!user) return err('Not found', 404)

  return ok({ calendarToken: user.calendarToken })
}

export async function POST() {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: { calendarToken: randomUUID() },
    select: { calendarToken: true },
  })

  return ok({ calendarToken: user.calendarToken })
}
