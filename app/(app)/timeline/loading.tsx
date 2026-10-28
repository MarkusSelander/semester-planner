import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/components/layout/PageShell'
import { DateRailSkeleton } from '@/components/shared/DateRailSkeleton'

export default function TimelineLoading() {
  return (
    <PageShell>
      <header className="mb-8 space-y-2 border-b border-border pb-5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-10 w-36" />
      </header>

      <div className="space-y-12">
        <section>
          <Skeleton className="mb-5 h-8 w-40" />
          <DateRailSkeleton rows={4} />
        </section>
        <section>
          <Skeleton className="mb-5 h-8 w-36" />
          <DateRailSkeleton rows={3} />
        </section>
      </div>
    </PageShell>
  )
}
