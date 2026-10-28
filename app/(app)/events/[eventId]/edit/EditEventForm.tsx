'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'
import { InlineSpinner } from '@/components/shared/InlineSpinner'
import { BackLink } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'
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
    <PageShell width="narrow">
      <BackLink href={`/events/${eventId}`}>Back</BackLink>
      <h1 className="page-title mb-8">Edit event</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="type">Type</FieldLabel>
            <select id="type" value={type} onChange={e => setType(e.target.value)} className="field-select">
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="priority">Priority</FieldLabel>
            <select id="priority" value={priority} onChange={e => setPriority(e.target.value)} className="field-select">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="date">Date</FieldLabel>
          <Input id="date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allDay"
            checked={isAllDay}
            onChange={e => setIsAllDay(e.target.checked)}
            className="rounded-sm border-input"
          />
          <label htmlFor="allDay" className="text-sm">All day</label>
        </div>

        {!isAllDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="startTime">Start</FieldLabel>
              <Input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="endTime">End</FieldLabel>
              <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        </div>
        <div>
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <Input id="location" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div>
          <FieldLabel htmlFor="url">URL</FieldLabel>
          <Input id="url" value={url} onChange={e => setUrl(e.target.value)} type="url" />
        </div>
        <div>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} aria-busy={loading}>{loading ? <><InlineSpinner className="mr-1" /> Saving…</> : 'Save changes'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </PageShell>
  )
}
