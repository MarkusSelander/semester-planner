'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { BackLink } from '@/components/shared/BackLink'
import { allDayToISO, getBrowserTimezone, zonedDateTimeToISO } from '@/lib/dates'
import { EVENT_TYPES, PRIORITIES, eventTypeLabel, priorityLabel } from '@/lib/event-display'
import { labelClassName, selectClassName, textareaClassName } from '@/lib/utils'

type Course = { id: string; name: string; code: string | null; semesterId: string }
type Semester = { id: string; name: string }

export default function NewEventPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('LECTURE')
  const [priority, setPriority] = useState<string>('MEDIUM')
  const [courseId, setCourseId] = useState(searchParams.get('courseId') ?? '')
  const [semesterId, setSemesterId] = useState(searchParams.get('semesterId') ?? '')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const [semesters, setSemesters] = useState<Semester[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    fetch('/api/semesters').then(r => r.json()).then(j => setSemesters(j.data ?? []))
  }, [])

  useEffect(() => {
    if (!semesterId) { setCourses([]); return }
    fetch(`/api/semesters/${semesterId}/courses`)
      .then(r => r.json())
      .then(j => {
        setCourses(j.data ?? [])
        if (!courseId && j.data?.length > 0) setCourseId(j.data[0].id)
      })
  }, [semesterId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!semesterId) { toast.error('Select a semester'); return }
    if (!courseId) { toast.error('Select a course'); return }
    if (!startDate) { toast.error('Set a start date'); return }

    const timeZone = getBrowserTimezone()
    const startAt = isAllDay
      ? allDayToISO(startDate)
      : zonedDateTimeToISO(startDate, startTime, timeZone)
    const endAt = !isAllDay && endTime
      ? zonedDateTimeToISO(startDate, endTime, timeZone)
      : undefined

    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          priority,
          courseId,
          semesterId,
          startAt,
          endAt,
          isAllDay,
          description: description || undefined,
          location: location || undefined,
          url: url || undefined,
          notes: notes || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Event created!')
      router.push(`/events/${json.data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto">
      <BackLink href="/list">All events</BackLink>
      <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-6">New Event</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="semesterId" className={labelClassName}>Semester</label>
          <select
            id="semesterId"
            value={semesterId}
            onChange={e => { setSemesterId(e.target.value); setCourseId('') }}
            className={selectClassName}
            required
          >
            <option value="">Select semester...</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="courseId" className={labelClassName}>Course</label>
          <select
            id="courseId"
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            className={selectClassName}
            required
            disabled={!semesterId}
          >
            <option value="">Select course...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code} — ` : ''}{c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className={labelClassName}>Title</label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Midterm Exam"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="type" className={labelClassName}>Type</label>
            <select
              id="type"
              value={type}
              onChange={e => setType(e.target.value)}
              className={selectClassName}
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
              className={selectClassName}
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="startDate" className={labelClassName}>Date</label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
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
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="endTime" className={labelClassName}>End time (optional)</label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="description" className={labelClassName}>Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className={textareaClassName}
          />
        </div>

        <div>
          <label htmlFor="location" className={labelClassName}>Location (optional)</label>
          <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room A101" />
        </div>

        <div>
          <label htmlFor="url" className={labelClassName}>URL (optional)</label>
          <Input id="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." type="url" />
        </div>

        <div>
          <label htmlFor="notes" className={labelClassName}>Notes (optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className={textareaClassName}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create event'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
