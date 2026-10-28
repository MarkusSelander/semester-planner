import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/components/layout/PageShell'
import { DateRailSkeleton } from '@/components/shared/DateRailSkeleton'

export default function AppLoading() {
  return (
    <PageShell>
      <div className="mb-8 space-y-2 border-b border-border pb-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-40" />
      </div>
      <DateRailSkeleton rows={5} />
    </PageShell>
  )
}
