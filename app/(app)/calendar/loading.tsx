import { Skeleton } from '@/components/ui/skeleton'
import { DateRailSkeleton } from '@/components/shared/DateRailSkeleton'

export default function CalendarLoading() {
  return (
    <div className="flex h-full flex-col px-4 py-6 md:px-8 md:py-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex gap-4 border-b border-border pb-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-16" />
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <div className="space-y-5 md:hidden">
          <DateRailSkeleton rows={7} />
        </div>
        <div className="hidden h-full min-h-[32rem] md:block" aria-hidden>
          <div className="mb-3 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton key={index} className="mx-auto h-3 w-8" />
            ))}
          </div>
          <div className="grid h-[calc(100%-1.5rem)] grid-cols-7 grid-rows-5 gap-px">
            {Array.from({ length: 35 }, (_, index) => (
              <Skeleton key={index} className="h-full min-h-16 rounded-none" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
