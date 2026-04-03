'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const EVENT_TYPES = ['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER'] as const
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const

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
        const dt = new Date(ev.startAt)
        setStartDate(dt.toISOString().split('T')[0])
        setStartTime(dt.toISOString().split('T')[1].slice(0, 5))
        if (ev.endAt) setEndTime(new Date(ev.endAt).toISOString().split('T')[1].slice(0, 5))
        setDescription(ev.description ?? '')
        setLocation(ev.location ?? '')
        setUrl(ev.url ?? '')
        setNotes(ev.notes ?? '')
      })
      .finally(() => setFetching(false))
  }, [eventId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const startAt = isAllDay
      ? `${startDate}T00:00:00+00:00`
      : `${startDate}T${startTime}:00+00:00`
    const endAt = !isAllDay && endTime
      ? `${startDate}T${endTime}:00+00:00`
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

  if (fetching) return <div className="p-8 text-sm text-gray-400">Loading...</div>

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
