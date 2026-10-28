import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/components/layout/PageShell'
import { DateRailSkeleton } from '@/components/shared/DateRailSkeleton'

export default function ListLoading() {
  return (
    <PageShell>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex gap-4 border-b border-border pb-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <Skeleton className="mb-4 h-3 w-36" />
          <DateRailSkeleton rows={4} />
        </section>
      </div>
    </PageShell>
  )
}
