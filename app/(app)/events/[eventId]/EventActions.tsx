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
    <div className="flex gap-2 flex-shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDone}
        aria-pressed={done}
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
