import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCalendarEvents } from '@/lib/queries'
import { CalendarView } from './CalendarView'

export default async function CalendarPage() {
  const userId = (await headers()).get('x-user-id')
  if (!userId) redirect('/login')

  const events = await getCalendarEvents(userId)
  return <CalendarView initialEvents={events} />
}
