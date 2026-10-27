'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export function NewCourseForm({
  semesters,
  initialSemesterId,
}: {
  semesters: { id: string; name: string }[]
  initialSemesterId: string
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [semesterId, setSemesterId] = useState(initialSemesterId)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    <div className="mx-auto w-full max-w-lg px-4 py-6 md:px-8 md:py-8">
      <Link href="/courses" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="page-title mb-6">New Course</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Semester</label>
          <select
            value={semesterId}
            onChange={e => setSemesterId(e.target.value)}
            className="field-select"
            required
          >
            <option value="">Select semester...</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Course name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Algorithms and Data Structures" required />
        </div>
        <div>
          <label className="field-label">Course code (optional)</label>
          <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. TDT4120" />
        </div>
        <div>
          <label className="field-label">Color</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-foreground/40 scale-110' : ''}`}
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
