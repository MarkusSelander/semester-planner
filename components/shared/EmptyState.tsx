import { LucideIcon } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={compact ? 'py-6' : 'border border-dashed border-border px-6 py-14 text-center'}>
      {!compact && <Icon className="mx-auto mb-3 h-5 w-5 text-muted-foreground" strokeWidth={1.75} />}
      <h3 className={`font-heading tracking-tight text-foreground ${compact ? 'text-lg' : 'text-xl'}`}>{title}</h3>
      <p className={`max-w-sm text-sm text-muted-foreground ${compact ? 'mt-1' : 'mx-auto mt-2'}`}>{description}</p>
      {actionLabel && actionHref && (
        <ButtonLink href={actionHref} className={compact ? 'mt-3' : 'mt-5'} size="sm">
          {actionLabel}
        </ButtonLink>
      )}
    </div>
  )
}
