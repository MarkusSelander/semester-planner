import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { createRemindersForEvent } from '@/lib/reminders'
import { TAGS, cachedQuery, invalidateUserCache } from '@/lib/cache'
import { z } from 'zod'

type RawEventRow = {
  id: string
  userId: string
  courseId: string
  semesterId: string
  title: string
  description: string | null
  type: string
  startAt: Date
  endAt: Date | null
  isAllDay: boolean
  isDone: boolean
  doneAt: Date | null
  priority: string
  location: string | null
  url: string | null
  notes: string | null
  source: string
  createdAt: Date
  updatedAt: Date
  course_name: string
  course_code: string | null
  course_color: string
}

const CreateEventSchema = z.object({
  courseId: z.string().uuid(),
  semesterId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER']),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }).optional(),
  isAllDay: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  location: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const sp = req.nextUrl.searchParams
  const semesterId = sp.get('semesterId')
  const courseId = sp.get('courseId')
  const type = sp.get('type')
  const done = sp.get('done')
  const from = sp.get('from')
  const to = sp.get('to')

  const cacheKey = `events:${auth.userId}:${semesterId}:${courseId}:${type}:${done}:${from}:${to}`

  const fetchEvents = () => cachedQuery(
    [cacheKey],
    [TAGS.events(auth.userId)],
    30,
    async () => {
      if (process.env.NODE_ENV !== 'production') console.log(`[cache] MISS  ${cacheKey}`)
      const whereClauses: Prisma.Sql[] = [Prisma.sql`e."userId" = ${auth.userId}`]

      if (semesterId) whereClauses.push(Prisma.sql`e."semesterId" = ${semesterId}`)
      if (courseId) whereClauses.push(Prisma.sql`e."courseId" = ${courseId}`)
      if (type) whereClauses.push(Prisma.sql`e.type::text = ${type}`)
      if (done !== null) whereClauses.push(Prisma.sql`e."isDone" = ${done === 'true'}`)
      if (from) whereClauses.push(Prisma.sql`e."startAt" >= ${new Date(from)}`)
      if (to) whereClauses.push(Prisma.sql`e."startAt" <= ${new Date(to)}`)

      const rows = await prisma.$queryRaw<RawEventRow[]>`
        SELECT
          e.id,
          e."userId",
          e."courseId",
          e."semesterId",
          e.title,
          e.description,
          e.type::text,
          e."startAt",
          e."endAt",
          e."isAllDay",
          e."isDone",
          e."doneAt",
          e.priority::text,
          e.location,
          e.url,
          e.notes,
          e.source::text,
          e."createdAt",
          e."updatedAt",
          c.name  AS course_name,
          c.code  AS course_code,
          c.color AS course_color
        FROM events e
        JOIN courses c ON c.id = e."courseId"
        WHERE ${Prisma.join(whereClauses, ' AND ')}
        ORDER BY e."startAt" ASC
        LIMIT 500
      `

      return rows.map(row => ({
        id: row.id,
        userId: row.userId,
        courseId: row.courseId,
        semesterId: row.semesterId,
        title: row.title,
        description: row.description,
        type: row.type,
        startAt: row.startAt,
        endAt: row.endAt,
        isAllDay: row.isAllDay,
        isDone: row.isDone,
        doneAt: row.doneAt,
        priority: row.priority,
        location: row.location,
        url: row.url,
        notes: row.notes,
        source: row.source,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        course: {
          id: row.courseId,
          name: row.course_name,
          code: row.course_code,
          color: row.course_color,
        },
      }))
    }
  )

  const events = await fetchEvents()
  return ok(events)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const parsed = CreateEventSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  // Verify course and semester belong to user
  const [course, user] = await Promise.all([
    prisma.course.findFirst({ where: { id: parsed.data.courseId, userId: auth.userId } }),
    prisma.user.findUnique({ where: { id: auth.userId }, select: { emailReminders: true } }),
  ])
  if (!course) return err('Course not found', 404)

  const event = await prisma.event.create({
    data: {
      userId: auth.userId,
      source: 'MANUAL',
      isAllDay: false,
      priority: 'MEDIUM',
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      url: parsed.data.url || null,
    },
    include: {
      course: { select: { id: true, name: true, code: true, color: true } },
    },
  })

  await createRemindersForEvent(event, user?.emailReminders ?? true)
  invalidateUserCache(auth.userId)
  return ok(event, 201)
}
