import { Skeleton } from '@/components/ui/skeleton'

export function FormPageSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto space-y-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  )
}
