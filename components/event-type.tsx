import {
  BookOpen,
  CircleDot,
  GraduationCap,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type EventTypeKey =
  | 'LECTURE'
  | 'EXERCISE'
  | 'ASSIGNMENT'
  | 'EXAM'
  | 'PROJECT'
  | 'OTHER'

export type EventCategory = 'deliverable' | 'exam' | 'passive'

type EventTypeMeta = {
  label: string
  category: EventCategory
  Icon: LucideIcon
  badge: string
  accent: string
  borderL: string
}

const META: Record<EventTypeKey, EventTypeMeta> = {
  EXERCISE: {
    label: 'Exercise',
    category: 'deliverable',
    Icon: Upload,
    badge: 'text-soon',
    accent: 'bg-soon',
    borderL: 'border-l-soon',
  },
  ASSIGNMENT: {
    label: 'Assignment',
    category: 'deliverable',
    Icon: Upload,
    badge: 'text-soon',
    accent: 'bg-soon',
    borderL: 'border-l-soon',
  },
  PROJECT: {
    label: 'Project',
    category: 'deliverable',
    Icon: Upload,
    badge: 'text-soon',
    accent: 'bg-soon',
    borderL: 'border-l-soon',
  },
  EXAM: {
    label: 'Exam',
    category: 'exam',
    Icon: GraduationCap,
    badge: 'text-overdue',
    accent: 'bg-overdue',
    borderL: 'border-l-overdue',
  },
  LECTURE: {
    label: 'Lecture',
    category: 'passive',
    Icon: BookOpen,
    badge: 'text-muted-foreground',
    accent: 'bg-border',
    borderL: 'border-l-border',
  },
  OTHER: {
    label: 'Other',
    category: 'passive',
    Icon: CircleDot,
    badge: 'text-muted-foreground',
    accent: 'bg-border',
    borderL: 'border-l-border',
  },
}

const FALLBACK = META.OTHER

export function eventTypeMeta(type: string): EventTypeMeta {
  return META[type as EventTypeKey] ?? FALLBACK
}

export function eventCategory(type: string): EventCategory {
  return eventTypeMeta(type).category
}

export function mustHandIn(type: string): boolean {
  return eventCategory(type) === 'deliverable'
}

export function isActionRequired(type: string): boolean {
  return eventCategory(type) !== 'passive'
}

export function TypeBadge({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  const meta = eventTypeMeta(type)
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[10px] font-medium uppercase tracking-[0.12em]',
        meta.badge,
        className,
      )}
    >
      {meta.label}
    </span>
  )
}

export function HandInTag({ type, className }: { type: string; className?: string }) {
  if (!mustHandIn(type)) return null
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-soon',
        className,
      )}
    >
      Hand in
    </span>
  )
}
