import { cn } from '@/lib/utils'

const widths = {
  narrow: 'max-w-lg',
  default: 'max-w-3xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
} as const

export function PageShell({
  children,
  width = 'default',
  className,
}: {
  children: React.ReactNode
  width?: keyof typeof widths
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full px-4 py-6 md:px-8 md:py-8', widths[width], className)}>
      {children}
    </div>
  )
}
