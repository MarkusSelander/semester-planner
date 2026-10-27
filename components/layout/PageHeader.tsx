import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: {
  kicker?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5', className)}>
      <div className="min-w-0">
        {kicker && <p className="page-kicker">{kicker}</p>}
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 ease-out-quart hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
      {children}
    </Link>
  )
}
