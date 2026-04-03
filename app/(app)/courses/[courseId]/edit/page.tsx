'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function EditCoursePage() {
  const params = useParams()
  const courseId = params.courseId as string
  const router = useRouter()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then(r => r.json())
      .then(j => {
        if (!j.data) return
        setName(j.data.name)
        setCode(j.data.code ?? '')
        setColor(j.data.color)
      })
      .finally(() => setFetching(false))
  }, [courseId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code: code || undefined, color }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Course updated!')
      router.push(`/courses/${courseId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Course deleted')
      router.push('/courses')
    } catch {
      toast.error('Failed to delete')
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (fetching) return <div className="p-8 text-sm text-gray-400">Loading...</div>

  return (
    <div className="p-8 max-w-lg mx-auto">
      <Link href={`/courses/${courseId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Course</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course name</label>
          <Input value={name} onChange={e => setName(e.target.value)} required />
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
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDelete(true)}
            className="ml-auto text-red-500 hover:text-red-600 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete course?"
        description="This will delete the course and all its events. This cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
