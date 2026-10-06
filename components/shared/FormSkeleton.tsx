import { Skeleton } from '@/components/ui/skeleton'

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="p-8 max-w-lg mx-auto" aria-busy="true">
      <Skeleton className="h-4 w-16 mb-6" />
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}
