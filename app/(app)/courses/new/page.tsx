'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
    <div className="p-8 max-w-lg mx-auto">
      <Link href="/courses" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Course</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select
            value={semesterId}
            onChange={e => setSemesterId(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Select semester...</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Algorithms and Data Structures" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course code (optional)</label>
          <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. TDT4120" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
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
