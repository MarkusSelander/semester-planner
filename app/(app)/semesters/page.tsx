import { headers } from 'next/headers'
import { getSemesters } from '@/lib/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, GraduationCap, Upload, ChevronRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { format } from 'date-fns'

export default async function SemestersPage() {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const semesters = await getSemesters(userId)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Semesters</h1>
          <p className="text-sm text-slate-500 mt-0.5">{semesters.length} semester{semesters.length !== 1 ? 's' : ''}</p>
        </div>
        <ButtonLink href="/semesters/new">
          <Plus className="h-4 w-4 mr-1.5" />
          New semester
        </ButtonLink>
      </div>

      {semesters.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No semesters yet</p>
          <p className="text-xs text-slate-400 mb-4">Create your first semester to start organizing your schedule.</p>
          <ButtonLink href="/semesters/new">Create semester</ButtonLink>
        </div>
      ) : (
        <div className="space-y-3">
          {semesters.map(semester => (
            <div key={semester.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h2 className="text-base font-semibold text-slate-900">{semester.name}</h2>
                      {semester.isActive && (
                        <span className="text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold ring-1 ring-emerald-200">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 tabular-nums">
                      {format(semester.startDate, 'd MMM yyyy')} – {format(semester.endDate, 'd MMM yyyy')}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="font-medium">{semester._count.courses} courses</span>
                      <span className="text-slate-300">·</span>
                      <span>{semester._count.events} events</span>
                    </div>
                    {semester.courses.length > 0 && (
                      <div className="flex gap-1.5 mt-3">
                        {semester.courses.map((c: { id: string; color: string }, i: number) => (
                          <span key={i} className="h-2 w-8 rounded-full" style={{ backgroundColor: c.color }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <ButtonLink href={`/semesters/${semester.id}/import`} variant="outline" size="sm">
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      Import
                    </ButtonLink>
                    <Link
                      href={`/semesters/${semester.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      View <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
