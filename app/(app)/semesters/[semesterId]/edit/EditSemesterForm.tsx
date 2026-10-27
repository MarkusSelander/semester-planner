'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

export function EditSemesterForm({
  semester,
}: {
  semester: { id: string; name: string; startDate: string; endDate: string }
}) {
  const semesterId = semester.id
  const [name, setName] = useState(semester.name)
  const [startDate, setStartDate] = useState(semester.startDate.split('T')[0])
  const [endDate, setEndDate] = useState(semester.endDate.split('T')[0])
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

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

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 md:px-8 md:py-8">
      <Link href={`/semesters/${semesterId}`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="page-title mb-6">Edit Semester</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="field-label">Start date</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="field-label">End date</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDelete(true)}
            className="ml-auto text-destructive hover:text-destructive hover:border-destructive/40"
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
