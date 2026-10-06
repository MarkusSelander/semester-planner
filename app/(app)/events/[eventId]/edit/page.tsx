import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getEvent } from '@/lib/queries'
import { getRequestTimezone } from '@/lib/dates.server'
import { EditEventForm } from './EditEventForm'

export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [{ eventId }, hdrs] = await Promise.all([params, headers()])
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const [event, timeZone] = await Promise.all([getEvent(userId, eventId), getRequestTimezone()])
  if (!event) notFound()

  return (
    <EditEventForm
      timeZone={timeZone}
      event={{
        id: event.id,
        title: event.title,
        type: String(event.type),
        priority: String(event.priority),
        startAt: event.startAt.toISOString(),
        endAt: event.endAt?.toISOString() ?? null,
        isAllDay: event.isAllDay,
        description: event.description,
        location: event.location,
        url: event.url,
        notes: event.notes,
      }}
    />
  )
}
