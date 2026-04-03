'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

export default function EditSemesterPage() {
  const params = useParams()
  const semesterId = params.semesterId as string
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/semesters/${semesterId}`)
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setName(j.data.name)
          setStartDate(j.data.startDate.split('T')[0])
          setEndDate(j.data.endDate.split('T')[0])
        }
      })
      .finally(() => setFetching(false))
  }, [semesterId])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/semesters/${semesterId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Semester deleted')
      router.push('/semesters')
    } catch {
      toast.error('Failed to delete')
      setDeleting(false)
      setShowDelete(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/semesters/${semesterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startDate, endDate }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Semester updated!')
      router.push(`/semesters/${semesterId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-sm text-gray-400">Loading...</div>

  return (
    <div className="p-8 max-w-lg mx-auto">
      <Link href={`/semesters/${semesterId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Semester</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
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
        title="Delete semester?"
        description="This will delete the semester and all its courses and events. This cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
