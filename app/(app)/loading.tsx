import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/components/layout/PageShell'

export default function AppLoading() {
  return (
    <PageShell width="wide">
      <div className="mb-8 space-y-2 border-b border-border pb-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="space-y-3 border-b border-border pb-8">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="space-y-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </PageShell>
  )
}
