'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Edit, Trash2 } from 'lucide-react'

export function EventActions({ eventId, isDone }: { eventId: string; isDone: boolean }) {
  const [done, setDone] = useState(isDone)
  const [toggling, setToggling] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function toggleDone() {
    setToggling(true)
    try {
      const res = await fetch(`/api/events/${eventId}/done`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      setDone(d => !d)
      toast.success(done ? 'Marked as not done' : 'Marked as done!')
      router.refresh()
    } catch {
      toast.error('Failed to update')
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Event deleted')
      router.push('/list')
    } catch {
      toast.error('Failed to delete')
      setDeleting(false)
      setShowDelete(false)
    }
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDone}
        disabled={toggling}
        className={done ? 'text-green-600 border-green-200 hover:text-green-700' : ''}
      >
        {done
          ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
          : <Circle className="h-4 w-4 mr-1" />}
        {done ? 'Done' : 'Mark done'}
      </Button>
      <ButtonLink href={`/events/${eventId}/edit`} variant="outline" size="sm">
        <Edit className="h-4 w-4" />
      </ButtonLink>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDelete(true)}
        className="text-red-500 hover:text-red-600 hover:border-red-300"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete event?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
