import { cn } from '@/lib/utils'

export function FieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label htmlFor={htmlFor} className={cn('field-label', className)}>
      {children}
    </label>
  )
}
