import { redirect } from 'next/navigation'
import { getAuthUserId } from '@/lib/api'
import { getUserProfile } from '@/lib/queries'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  // Also creates the user row on first visit, like the profile API did.
  const auth = await getAuthUserId()
  if ('error' in auth) redirect('/login')

  const profile = await getUserProfile(auth.userId)

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
