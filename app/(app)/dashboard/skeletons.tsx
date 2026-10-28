import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/components/layout/PageShell'
import { DateRailSkeleton } from '@/components/shared/DateRailSkeleton'

export function NextBodySkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-10 w-2/3 md:h-12" />
      <Skeleton className="mt-3 h-3 w-72 max-w-full" />
    </div>
  )
}

export function TodayCountSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-9 w-10" />
      <Skeleton className="mt-2 h-3 w-14" />
    </div>
  )
}

export function SemesterListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="space-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

export function DashboardLoadingSkeleton() {
  return (
    <PageShell width="wide">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </header>

      <section className="border-b border-border pb-8">
        <Skeleton className="mb-3 h-3 w-12" />
        <NextBodySkeleton />
      </section>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <DateRailSkeleton rows={3} />
        </section>
        <aside className="space-y-8">
          <div>
            <Skeleton className="mb-2 h-3 w-12" />
            <TodayCountSkeleton />
          </div>
          <div>
            <Skeleton className="mb-3 h-3 w-16" />
            <SemesterListSkeleton />
          </div>
          <div>
            <Skeleton className="mb-2 h-3 w-14" />
            <Skeleton className="h-4 w-24" />
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
