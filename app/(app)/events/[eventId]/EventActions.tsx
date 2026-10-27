'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Edit, Trash2 } from 'lucide-react'

export function EventActions({ eventId, isDone }: { eventId: string; isDone: boolean }) {
  const [done, setDone] = useState(isDone)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  // Each PATCH flips the stored value, so rapid repeated clicks stay consistent
  // with the local state without disabling the button.
  async function toggleDone() {
    const next = !done
    setDone(next)
    try {
      const res = await fetch(`/api/events/${eventId}/done`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      toast.success(next ? 'Marked as done!' : 'Marked as not done')
      startTransition(() => router.refresh())
    } catch {
      setDone(d => !d)
      toast.error('Failed to update')
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
    <div className="flex shrink-0 gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDone}
        aria-pressed={done}
        className={done ? 'text-done' : ''}
      >
        {done
          ? <CheckCircle2 className="mr-1 h-4 w-4 text-done" strokeWidth={1.75} />
          : <Circle className="mr-1 h-4 w-4" strokeWidth={1.75} />}
        {done ? 'Done' : 'Mark done'}
      </Button>
      <ButtonLink href={`/events/${eventId}/edit`} variant="outline" size="sm" aria-label="Edit event">
        <Edit className="h-4 w-4" strokeWidth={1.75} />
      </ButtonLink>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDelete(true)}
        className="text-overdue"
        aria-label="Delete event"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
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
