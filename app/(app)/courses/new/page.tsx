'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { BackLink } from '@/components/shared/BackLink'
import { labelClassName, selectFullClassName } from '@/lib/utils'

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function NewCoursePage() {
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [semesterId, setSemesterId] = useState(searchParams.get('semesterId') ?? '')
  const [semesters, setSemesters] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/semesters').then(r => r.json()).then(j => setSemesters(j.data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!semesterId) { toast.error('Select a semester'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code: code || undefined, color, semesterId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Course created!')
      router.push(`/courses/${json.data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto">
      <BackLink href="/courses">All courses</BackLink>
      <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-6">New Course</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="semesterId" className={labelClassName}>Semester</label>
          <select
            id="semesterId"
            value={semesterId}
            onChange={e => setSemesterId(e.target.value)}
            className={selectFullClassName}
            required
          >
            <option value="">Select semester...</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="name" className={labelClassName}>Course name</label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Algorithms and Data Structures" required />
        </div>
        <div>
          <label htmlFor="code" className={labelClassName}>Course code (optional)</label>
          <Input id="code" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. TDT4120" />
        </div>
        <div>
          <p id="color-label" className={labelClassName}>Color</p>
          <div className="flex gap-2" role="group" aria-labelledby="color-label">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Select color ${c}`}
                aria-pressed={color === c}
                className={`h-7 w-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create course'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
