import { Skeleton } from '@/components/ui/skeleton'

export function DateRailSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[3.75rem_minmax(0,1fr)] md:grid-cols-[4.5rem_minmax(0,1fr)]"
        >
          <div className="space-y-1 border-r border-primary/80 pr-3 pt-0.5">
            <Skeleton className="ml-auto h-4 w-5" />
            <Skeleton className="ml-auto h-3 w-8" />
            <Skeleton className="ml-auto mt-0.5 h-3 w-10" />
          </div>
          <div className="min-w-0 space-y-2 pl-3 pt-0.5 md:pl-4">
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}
