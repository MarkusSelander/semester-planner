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

// "deliverable" = something the student has to hand in (øving/oppgave/prosjekt).
// "exam" = a hard, important deadline that is sat rather than handed in.
// "passive" = attend / informational only (forelesning/annet).
export type EventCategory = 'deliverable' | 'exam' | 'passive'

type EventTypeMeta = {
  label: string
  category: EventCategory
  Icon: LucideIcon
  /** Solid, high-contrast pill for things that need action; muted for passive. */
  badge: string
  /** Accent background color used for left bars and timeline dots. */
  accent: string
  /** Matching left-border color (kept as a literal so Tailwind emits it). */
  borderL: string
}

const META: Record<EventTypeKey, EventTypeMeta> = {
  EXERCISE: {
    label: 'Exercise',
    category: 'deliverable',
    Icon: Upload,
    badge: 'bg-sky-600 text-white ring-1 ring-sky-700/10',
    accent: 'bg-sky-500',
    borderL: 'border-l-sky-500',
  },
  ASSIGNMENT: {
    label: 'Assignment',
    category: 'deliverable',
    Icon: Upload,
    badge: 'bg-amber-500 text-white ring-1 ring-amber-600/10',
    accent: 'bg-amber-500',
    borderL: 'border-l-amber-500',
  },
  PROJECT: {
    label: 'Project',
    category: 'deliverable',
    Icon: Upload,
    badge: 'bg-violet-600 text-white ring-1 ring-violet-700/10',
    accent: 'bg-violet-500',
    borderL: 'border-l-violet-500',
  },
  EXAM: {
    label: 'Exam',
    category: 'exam',
    Icon: GraduationCap,
    badge: 'bg-rose-600 text-white ring-1 ring-rose-700/10',
    accent: 'bg-rose-500',
    borderL: 'border-l-rose-500',
  },
  LECTURE: {
    label: 'Lecture',
    category: 'passive',
    Icon: BookOpen,
    badge: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    accent: 'bg-slate-300',
    borderL: 'border-l-slate-300',
  },
  OTHER: {
    label: 'Other',
    category: 'passive',
    Icon: CircleDot,
    badge: 'bg-slate-100 text-slate-400 ring-1 ring-slate-200',
    accent: 'bg-slate-200',
    borderL: 'border-l-slate-200',
  },
}

const FALLBACK = META.OTHER

export function eventTypeMeta(type: string): EventTypeMeta {
  return META[type as EventTypeKey] ?? FALLBACK
}

export function eventCategory(type: string): EventCategory {
  return eventTypeMeta(type).category
}

/** True for anything the student must hand in (øving/oppgave/prosjekt). */
export function mustHandIn(type: string): boolean {
  return eventCategory(type) === 'deliverable'
}

/** True for deliverables and exams — the events worth emphasizing. */
export function isActionRequired(type: string): boolean {
  return eventCategory(type) !== 'passive'
}

/**
 * Pill showing the event type. Deliverables and exams get a solid, high-contrast
 * badge with an icon so they stand out from muted, informational lectures.
 */
export function TypeBadge({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  const meta = eventTypeMeta(type)
  const Icon = meta.Icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        meta.badge,
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      {meta.label}
    </span>
  )
}

/**
 * Compact "must hand in" flag. Render next to deliverables to remind the student
 * that the event has to be submitted. Renders nothing for passive/exam types.
 */
export function HandInTag({ type, className }: { type: string; className?: string }) {
  if (!mustHandIn(type)) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-300',
        className,
      )}
    >
      <Upload className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
      Hand in
    </span>
  )
}
