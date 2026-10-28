'use client'

import { createContext, useContext, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EventSnapshot = {
  courseId: string
  semesterId: string
  title: string
  description: string | null
  type: string
  startAt: string
  endAt: string | null
  isAllDay: boolean
  priority: string
  location: string | null
  url: string | null
  notes: string | null
}

type DoneContextValue = {
  done: boolean
  setDone: React.Dispatch<React.SetStateAction<boolean>>
}

const DoneContext = createContext<DoneContextValue | null>(null)

function useDone() {
  const value = useContext(DoneContext)
  if (!value) throw new Error('Event done controls must render inside EventDoneScope')
  return value
}

export function EventDoneScope({
  isDone,
  children,
}: {
  isDone: boolean
  children: React.ReactNode
}) {
  const [done, setDone] = useState(isDone)
  return <DoneContext.Provider value={{ done, setDone }}>{children}</DoneContext.Provider>
}

export function EventDoneStatus({ whenOpen }: { whenOpen: { label: string; cls: string } }) {
  const { done } = useDone()
  return <span className={done ? 'text-done' : whenOpen.cls}>{done ? 'Done' : whenOpen.label}</span>
}

export function EventDoneTitle({ children }: { children: React.ReactNode }) {
  const { done } = useDone()
  return (
    <h1 className={cn('page-title mt-1', done && 'text-muted-foreground line-through')}>
      {children}
    </h1>
  )
}

export function EventDoneCompleted({ text }: { text: string | null }) {
  const { done } = useDone()
  if (!done) return null
  return <p className="mt-2 font-mono text-xs text-done">{text ?? 'Completed'}</p>
}

export function EventActions({
  eventId,
  snapshot,
}: {
  eventId: string
  snapshot: EventSnapshot
}) {
  const { done, setDone } = useDone()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const toggleRequest = useRef(0)

  // Optimistic flip only. PATCH /done already calls invalidateUserCache(['events']),
  // so overdue and other event lists refresh on the next navigation.
  async function toggleDone() {
    const requestId = ++toggleRequest.current
    let next = done
    setDone(current => {
      next = !current
      return next
    })
    try {
      const res = await fetch(`/api/events/${eventId}/done`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      if (requestId !== toggleRequest.current) return
      toast.success(next ? 'Marked as done!' : 'Marked as not done')
    } catch {
      if (requestId !== toggleRequest.current) return
      setDone(current => !current)
      toast.error('Failed to update')
    }
  }

  async function restoreEvent() {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: snapshot.courseId,
        semesterId: snapshot.semesterId,
        title: snapshot.title,
        description: snapshot.description ?? undefined,
        type: snapshot.type,
        startAt: snapshot.startAt,
        endAt: snapshot.endAt ?? undefined,
        isAllDay: snapshot.isAllDay,
        priority: snapshot.priority,
        location: snapshot.location ?? undefined,
        url: snapshot.url || undefined,
        notes: snapshot.notes ?? undefined,
      }),
    })
    if (!res.ok) throw new Error()
    const json = await res.json()
    toast.success('Event restored')
    router.push(`/events/${json.data.id}`)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Event deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            restoreEvent().catch(() => toast.error('Could not restore event'))
          },
        },
      })
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
        className={cn('transition-[color,transform] duration-[var(--duration-std)] ease-out-quart', done && 'text-done')}
      >
        {done
          ? <CheckCircle2 className="mr-1 h-4 w-4 text-done transition-opacity duration-[var(--duration-std)]" strokeWidth={1.75} />
          : <Circle className="mr-1 h-4 w-4 transition-opacity duration-[var(--duration-std)]" strokeWidth={1.75} />}
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
        description="You can undo this from the confirmation toast."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
