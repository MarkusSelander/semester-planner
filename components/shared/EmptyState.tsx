import { LucideIcon } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  secondaryActionLabel?: string
  secondaryActionHref?: string
  compact?: boolean
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center',
        compact
          ? 'py-6'
          : 'rounded-xl border border-slate-200 bg-white p-12 shadow-sm',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center mx-auto mb-4 bg-slate-100',
          compact ? 'h-9 w-9 rounded-lg' : 'h-12 w-12 rounded-xl',
        )}
      >
        <Icon className={cn('text-slate-400', compact ? 'h-4 w-4' : 'h-6 w-6')} />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">{title}</p>
      <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">{description}</p>
      {actionLabel && actionHref && (
        <div className="flex items-center justify-center gap-2">
          <ButtonLink href={actionHref} size={compact ? 'sm' : 'default'}>
            {actionLabel}
          </ButtonLink>
          {secondaryActionLabel && secondaryActionHref && (
            <ButtonLink href={secondaryActionHref} variant="outline" size={compact ? 'sm' : 'default'}>
              {secondaryActionLabel}
            </ButtonLink>
          )}
        </div>
      )}
    </div>
  )
}
