import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { z } from 'zod'

const UpdateSchema = z.object({
  fullName: z.string().optional(),
  timezone: z.string().optional(),
  emailReminders: z.boolean().optional(),
})

export async function GET() {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const user = await prisma.user.findUnique({ where: { id: auth.userId } })
  if (!user) return err('User not found', 404)
  return ok(user)
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const user = await prisma.user.upsert({
    where: { id: auth.userId },
    update: parsed.data,
    create: { id: auth.userId, email: '', ...parsed.data },
  })
  return ok(user)
}
