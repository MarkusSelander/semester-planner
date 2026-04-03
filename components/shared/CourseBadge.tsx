interface CourseBadgeProps {
  name: string
  code?: string | null
  color: string
}

export function CourseBadge({ name, code, color }: CourseBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700">
      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {code ?? name}
    </span>
  )
}
