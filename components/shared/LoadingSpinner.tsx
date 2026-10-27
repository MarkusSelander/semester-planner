import { cn } from '@/lib/utils'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="h-5 w-5 animate-spin rounded-full border border-border border-t-primary" />
    </div>
  )
}
