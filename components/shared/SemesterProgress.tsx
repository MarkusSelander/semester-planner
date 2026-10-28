import { cn } from '@/lib/utils'

export function semesterProgress(startDate: Date, endDate: Date, now = new Date()) {
  const start = startDate.getTime()
  const end = endDate.getTime()
  const span = Math.max(end - start, 1)
  const ratio = Math.min(1, Math.max(0, (now.getTime() - start) / span))
  if (now.getTime() < start) return { ratio: 0, label: 'Not started' }
  if (now.getTime() > end) return { ratio: 1, label: 'Ended' }
  const daysLeft = Math.ceil((end - now.getTime()) / 86_400_000)
  return { ratio, label: `${daysLeft}d left` }
}

export function ProgressBar({
  ratio,
  label,
  className,
}: {
  ratio: number
  label: string
  className?: string
}) {
  const clamped = Math.min(1, Math.max(0, ratio))
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="h-1 overflow-hidden rounded-sm bg-muted">
        <div
          className="progress-fill h-full origin-left bg-primary"
          style={{ transform: `scaleX(${clamped})` }}
        />
      </div>
      <p className="font-mono text-[11px] tabular-nums text-muted-foreground">{label}</p>
    </div>
  )
}

export function SemesterProgress({
  startDate,
  endDate,
  className,
}: {
  startDate: Date
  endDate: Date
  className?: string
}) {
  const { ratio, label } = semesterProgress(startDate, endDate)
  return <ProgressBar ratio={ratio} label={`${Math.round(ratio * 100)}% · ${label}`} className={className} />
}
