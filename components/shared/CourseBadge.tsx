interface CourseBadgeProps {
  name: string
  code?: string | null
  color: string
}

export function CourseBadge({ name, code, color }: CourseBadgeProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-sm text-foreground">
      <span className="h-3 w-0.5 shrink-0" style={{ backgroundColor: color }} />
      <span className="truncate">{name}</span>
      {code && (
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          {code}
        </span>
      )}
    </span>
  )
}
