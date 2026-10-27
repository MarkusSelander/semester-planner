import { LucideIcon } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-border px-6 py-14 text-center">
      <Icon className="mx-auto mb-3 h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
      <h3 className="font-heading text-xl tracking-tight text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionHref && (
        <ButtonLink href={actionHref} className="mt-5">
          {actionLabel}
        </ButtonLink>
      )}
    </div>
  )
}
