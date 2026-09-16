import { isBefore } from 'date-fns'
import { isTodayTz } from '@/lib/dates'

export const EVENT_TYPES = ['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER'] as const
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const

export type EventType = (typeof EVENT_TYPES)[number]
export type Priority = (typeof PRIORITIES)[number]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  LECTURE: 'Lecture',
  EXERCISE: 'Exercise',
  ASSIGNMENT: 'Assignment',
  EXAM: 'Exam',
  PROJECT: 'Project',
  OTHER: 'Other',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const EVENT_TYPE_STYLES: Record<EventType, { badge: string; bar: string; dot: string }> = {
  EXAM: { badge: 'bg-red-50 text-red-700 ring-1 ring-red-200', bar: 'bg-red-500', dot: 'bg-red-500' },
  ASSIGNMENT: { badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  PROJECT: { badge: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200', bar: 'bg-purple-500', dot: 'bg-purple-500' },
  EXERCISE: { badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', bar: 'bg-blue-500', dot: 'bg-blue-500' },
  LECTURE: { badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200', bar: 'bg-slate-400', dot: 'bg-slate-400' },
  OTHER: { badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200', bar: 'bg-slate-400', dot: 'bg-slate-400' },
}

export const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  LOW: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
}

export const STATUS_STYLES = {
  Done: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Today: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Overdue: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  Upcoming: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
} as const

export function eventTypeLabel(type: string) {
  return EVENT_TYPE_LABELS[type as EventType] ?? type
}

export function priorityLabel(priority: string) {
  return PRIORITY_LABELS[priority as Priority] ?? priority
}

export function eventTypeStyle(type: string) {
  return EVENT_TYPE_STYLES[type as EventType] ?? EVENT_TYPE_STYLES.OTHER
}

export function priorityStyle(priority: string) {
  return PRIORITY_STYLES[priority as Priority] ?? PRIORITY_STYLES.MEDIUM
}

export function eventStatus(
  event: { isDone: boolean; startAt: Date | string },
  timeZone: string,
) {
  const startAt = new Date(event.startAt)
  if (event.isDone) return { label: 'Done' as const, cls: STATUS_STYLES.Done }
  if (isTodayTz(startAt, timeZone)) return { label: 'Today' as const, cls: STATUS_STYLES.Today }
  if (isBefore(startAt, new Date())) return { label: 'Overdue' as const, cls: STATUS_STYLES.Overdue }
  return { label: 'Upcoming' as const, cls: STATUS_STYLES.Upcoming }
}
