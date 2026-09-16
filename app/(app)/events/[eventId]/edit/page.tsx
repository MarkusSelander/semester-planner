'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { BackLink } from '@/components/shared/BackLink'
import { FormPageSkeleton } from '@/components/shared/FormPageSkeleton'
import {
  allDayToISO,
  getBrowserTimezone,
  toDateInputValue,
  toTimeInputValue,
  zonedDateTimeToISO,
} from '@/lib/dates'
import { EVENT_TYPES, PRIORITIES, eventTypeLabel, priorityLabel } from '@/lib/event-display'
import { labelClassName, selectFullClassName, textareaClassName } from '@/lib/utils'

export default function EditEventPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [type, setType] = useState('LECTURE')
  const [priority, setPriority] = useState('MEDIUM')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then(r => r.json())
      .then(j => {
        if (!j.data) return
        const ev = j.data
        setTitle(ev.title)
        setType(ev.type)
        setPriority(ev.priority)
        setIsAllDay(ev.isAllDay)
        const timeZone = getBrowserTimezone()
        const dt = new Date(ev.startAt)
        setStartDate(toDateInputValue(dt, timeZone, ev.isAllDay))
        setStartTime(toTimeInputValue(dt, timeZone))
        if (ev.endAt) setEndTime(toTimeInputValue(new Date(ev.endAt), timeZone))
        setDescription(ev.description ?? '')
        setLocation(ev.location ?? '')
        setUrl(ev.url ?? '')
        setNotes(ev.notes ?? '')
      })
      .finally(() => setFetching(false))
  }, [eventId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const timeZone = getBrowserTimezone()
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

  if (fetching) return <FormPageSkeleton />

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto">
      <BackLink href="/list">All events</BackLink>
      <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-6">Edit Event</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className={labelClassName}>Title</label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="type" className={labelClassName}>Type</label>
            <select
              id="type"
              value={type}
              onChange={e => setType(e.target.value)}
              className={selectFullClassName}
            >
              {EVENT_TYPES.map(t => <option key={t} value={t}>{eventTypeLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className={labelClassName}>Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className={selectFullClassName}
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="startDate" className={labelClassName}>Date</label>
          <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allDay"
            checked={isAllDay}
            onChange={e => setIsAllDay(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="allDay" className="text-sm text-slate-700">All day</label>
        </div>

        {!isAllDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startTime" className={labelClassName}>Start time</label>
              <Input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label htmlFor="endTime" className={labelClassName}>End time (optional)</label>
              <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="description" className={labelClassName}>Description</label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className={textareaClassName}
          />
        </div>

        <div>
          <label htmlFor="location" className={labelClassName}>Location</label>
          <Input id="location" value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <div>
          <label htmlFor="url" className={labelClassName}>URL</label>
          <Input id="url" value={url} onChange={e => setUrl(e.target.value)} type="url" />
        </div>

        <div>
          <label htmlFor="notes" className={labelClassName}>Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className={textareaClassName}
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
