import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "skeleton-shimmer rounded-sm bg-muted",
        "bg-[linear-gradient(90deg,var(--muted)_0%,color-mix(in_oklab,var(--foreground)_8%,var(--muted))_50%,var(--muted)_100%)] bg-[length:200%_100%]",
        "motion-safe:animate-[shimmer_1.6s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
