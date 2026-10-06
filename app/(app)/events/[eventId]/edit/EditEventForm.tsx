'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  allDayToISO,
  toDateInputValue,
  toTimeInputValue,
  zonedDateTimeToISO,
} from '@/lib/dates'

const EVENT_TYPES = ['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER'] as const
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const

export type EditableEvent = {
  id: string
  title: string
  type: string
  priority: string
  startAt: string
  endAt: string | null
  isAllDay: boolean
  description: string | null
  location: string | null
  url: string | null
  notes: string | null
}

export function EditEventForm({ event, timeZone }: { event: EditableEvent; timeZone: string }) {
  const eventId = event.id
  const router = useRouter()

  const [title, setTitle] = useState(event.title)
  const [type, setType] = useState(event.type)
  const [priority, setPriority] = useState(event.priority)
  const [startDate, setStartDate] = useState(() => toDateInputValue(event.startAt, timeZone, event.isAllDay))
  const [startTime, setStartTime] = useState(() => toTimeInputValue(event.startAt, timeZone))
  const [endTime, setEndTime] = useState(() => (event.endAt ? toTimeInputValue(event.endAt, timeZone) : ''))
  const [isAllDay, setIsAllDay] = useState(event.isAllDay)
  const [description, setDescription] = useState(event.description ?? '')
  const [location, setLocation] = useState(event.location ?? '')
  const [url, setUrl] = useState(event.url ?? '')
  const [notes, setNotes] = useState(event.notes ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const startAt = isAllDay
      ? allDayToISO(startDate)
      : zonedDateTimeToISO(startDate, startTime, timeZone)
    const endAt = !isAllDay && endTime
      ? zonedDateTimeToISO(startDate, endTime, timeZone)
      : null

    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          priority,
          startAt,
          endAt,
          isAllDay,
          description: description || null,
          location: location || null,
          url: url || null,
          notes: notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Event updated!')
      router.push(`/events/${eventId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <Link href={`/events/${eventId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allDay"
            checked={isAllDay}
            onChange={e => setIsAllDay(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="allDay" className="text-sm text-gray-700">All day</label>
        </div>

        {!isAllDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End time (optional)</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <Input value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
          <Input value={url} onChange={e => setUrl(e.target.value)} type="url" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
