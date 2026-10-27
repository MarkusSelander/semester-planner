import {
  BookOpen,
  CalendarDays,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const primaryNav: NavItem[] = [
  { href: '/dashboard', label: 'Today', icon: LayoutDashboard },
  { href: '/timeline', label: 'Timeline', icon: GitBranch },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/list', label: 'Events', icon: ListChecks },
]

export const resourceNav: NavItem[] = [
  { href: '/semesters', label: 'Semesters', icon: GraduationCap },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function navIsActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}
