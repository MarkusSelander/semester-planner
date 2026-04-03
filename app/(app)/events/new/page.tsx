'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const EVENT_TYPES = ['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER'] as const
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const

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

    const startAt = isAllDay
      ? `${startDate}T00:00:00+00:00`
      : `${startDate}T${startTime}:00+00:00`
    const endAt = !isAllDay && endTime
      ? `${startDate}T${endTime}:00+00:00`
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
    <div className="p-8 max-w-lg mx-auto">
      <Link href="/list" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Event</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select
            value={semesterId}
            onChange={e => { setSemesterId(e.target.value); setCourseId('') }}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Select semester...</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <select
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Midterm Exam"
            required
          />
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
          <Input
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
          <label htmlFor="allDay" className="text-sm text-gray-700">All day</label>
        </div>

        {!isAllDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
              <Input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End time (optional)</label>
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
          <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room A101" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL (optional)</label>
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." type="url" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
