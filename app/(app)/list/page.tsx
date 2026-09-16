import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSemesters, getFilteredEvents } from '@/lib/queries'
import { EventList } from './EventList'

const TASK_TYPES = ['EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT']
const LECTURE_TYPES = ['LECTURE', 'OTHER']

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ semesterId?: string; type?: string; done?: string; view?: string; overdue?: string }>
}) {
  const [hdrs, sp] = await Promise.all([headers(), searchParams])
  const userId = hdrs.get('x-user-id')
  if (!userId) redirect('/login')

  const overdueOnly = sp.overdue === '1'
  const view = (sp.view ?? 'all') as 'all' | 'tasks' | 'lectures'
  const semesterId = sp.semesterId ?? ''
  const typeFilter = view === 'all' ? (sp.type ?? '') : ''
  // Overdue means "not done"; force the done filter so the query only returns
  // open items and let EventList narrow them down to past events.
  const doneFilter = overdueOnly ? 'false' : (sp.done ?? (view === 'tasks' ? 'false' : ''))

  const types = view === 'tasks' ? TASK_TYPES : view === 'lectures' ? LECTURE_TYPES : undefined

  const [events, semesters] = await Promise.all([
    getFilteredEvents(userId, {
      semesterId: semesterId || undefined,
      type: typeFilter || undefined,
      types,
      done: doneFilter || undefined,
    }),
    getSemesters(userId),
  ])

  return (
    <EventList
      key={`${view}-${semesterId}-${typeFilter}-${doneFilter}-${overdueOnly}`}
      initialEvents={events}
      semesters={semesters.map(s => ({ id: s.id, name: s.name }))}
      semesterId={semesterId}
      typeFilter={typeFilter}
      doneFilter={doneFilter}
      view={view}
      overdueOnly={overdueOnly}
    />
  )
}
