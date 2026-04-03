import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Track which user IDs have an existing row this process lifetime.
// Avoids a SELECT on every API request after the first encounter.
const knownUsers = new Set<string>()
const pendingUserUpserts = new Map<string, Promise<void>>()

export async function getAuthUserId(): Promise<{ userId: string } | { error: NextResponse }> {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')
  if (!userId) {
    return { error: NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 }) }
  }

  // Only touch the DB on first encounter — upsert is safe and idempotent
  if (!knownUsers.has(userId)) {
    const pending = pendingUserUpserts.get(userId)
    if (pending) {
      await pending
    } else {
      const upsertPromise = prisma.user
        .upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: hdrs.get('x-user-email') ?? '',
            fullName: hdrs.get('x-user-name') ?? null,
          },
        })
        .then(() => {
          knownUsers.add(userId)
        })
        .finally(() => {
          pendingUserUpserts.delete(userId)
        })

      pendingUserUpserts.set(userId, upsertPromise)
      await upsertPromise
    }
  }

  return { userId }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status })
}
