import { headers } from 'next/headers'
import { getSemesters } from '@/lib/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, GraduationCap, Upload } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDateOnly } from '@/lib/dates'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'
import { SemesterProgress } from '@/components/shared/SemesterProgress'

export default async function SemestersPage() {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const semesters = await getSemesters(userId)

  return (
    <PageShell width="wide">
      <PageHeader
        kicker="Library"
        title="Semesters"
        description={`${semesters.length} ${semesters.length === 1 ? 'term' : 'terms'}`}
        actions={
          <ButtonLink href="/semesters/new" size="sm">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            New semester
          </ButtonLink>
        }
      />

      {semesters.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No semesters"
          description="Create a term before you add courses and events."
          actionLabel="Create semester"
          actionHref="/semesters/new"
        />
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {semesters.map(semester => (
            <li key={semester.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
              <Link href={`/semesters/${semester.id}`} className="min-w-0 flex-1 rounded-sm py-1 transition-colors duration-[var(--duration-micro)] ease-out-quart hover:text-primary">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="font-heading text-xl tracking-tight">{semester.name}</h2>
                  {semester.isActive && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-done">Active</span>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatDateOnly(semester.startDate, 'd MMM yyyy')} – {formatDateOnly(semester.endDate, 'd MMM yyyy')}
                </p>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {semester._count.courses} courses · {semester._count.events} events
                </p>
                <SemesterProgress startDate={semester.startDate} endDate={semester.endDate} className="mt-3 max-w-xs" />
                {semester.courses.length > 0 && (
                  <div className="mt-3 flex gap-1">
                    {semester.courses.map((c: { id: string; color: string }) => (
                      <span key={c.id} className="h-0.5 w-8" style={{ backgroundColor: c.color }} />
                    ))}
                  </div>
                )}
              </Link>
              <ButtonLink href={`/semesters/${semester.id}/import`} variant="outline" size="sm">
                <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
                Import
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
