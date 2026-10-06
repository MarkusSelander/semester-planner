import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuthUserId } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import { getUserProfile } from '@/lib/queries'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')

  let profile = await getUserProfile(userId)
  if (!profile) {
    // First visit before any API call created the row. Bypass the cached
    // (null) profile after creating it.
    await getAuthUserId()
    profile = await prisma.user.findUnique({ where: { id: userId } })
  }

  return (
    <SettingsForm
      profile={{
        fullName: profile?.fullName ?? null,
        timezone: profile?.timezone ?? 'Europe/Oslo',
        emailReminders: profile?.emailReminders ?? true,
        calendarToken: profile?.calendarToken ?? null,
      }}
    />
  )
}
