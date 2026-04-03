import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

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
  // Aliased JOIN columns
  course_id: string
  course_name: string
  course_code: string | null
  course_color: string
  semester_id: string
  semester_name: string
}

type RawTimelineRow = {
  id: string
  title: string
  type: string
  startAt: Date
  isAllDay: boolean
  isDone: boolean
  course_id: string
  course_name: string
  course_code: string | null
  course_color: string
  semester_id: string
  semester_name: string
}

type TimelineEvent = {
  id: string
  title: string
  type: string
  startAt: Date
  isAllDay: boolean
  isDone: boolean
  course: {
    id: string
    name: string
    code: string | null
    color: string
  }
  semester: {
    id: string
    name: string
  }
}

function mapRawSemester(row: RawSemesterRow) {
  return {
    id: row.id,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    _count: {
      courses: Number(row.course_count),
      events: Number(row.event_count),
    },
    courses: row.course_colors.slice(0, 6),
  }
}

function mapRawTimelineEvent(row: RawTimelineRow): TimelineEvent {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    startAt: row.startAt,
    isAllDay: row.isAllDay,
    isDone: row.isDone,
    course: {
      id: row.course_id,
      name: row.course_name,
      code: row.course_code,
      color: row.course_color,
    },
    semester: {
      id: row.semester_id,
      name: row.semester_name,
    },
  }
}

function mapRawEvent(row: RawEventRow) {
  return {
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
      id: row.course_id,
      name: row.course_name,
      code: row.course_code,
      color: row.course_color,
    },
    semester: {
      id: row.semester_id,
      name: row.semester_name,
    },
  }
}

export const TAGS = {
  semesters: (userId: string) => `semesters:${userId}`,
  courses: (userId: string) => `courses:${userId}`,
  events: (userId: string) => `events:${userId}`,
}

function timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now()
  return fn().then(result => {
    console.log(`[query] ${name}: ${Date.now() - t0}ms`)
    return result
  })
}

export const getSemesters = (userId: string) =>
  unstable_cache(
    () =>
      timed('getSemesters', () =>
        prisma.semester.findMany({
          where: { userId },
          include: {
            _count: { select: { courses: true, events: true } },
            courses: { select: { color: true }, take: 6 },
          },
          orderBy: { startDate: 'desc' },
        })
      ),
    [`semesters:${userId}`],
    { tags: [TAGS.semesters(userId)], revalidate: 60 }
  )()

type RawSemesterRow = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  course_count: bigint
  event_count: bigint
  // course color dots — we'll aggregate as JSON
  course_colors: { id: string; name: string; code: string | null; color: string }[]
}

export const getActiveSemesters = (userId: string) =>
  unstable_cache(
    () =>
      timed('getActiveSemesters', () =>
        prisma.$queryRaw<RawSemesterRow[]>`
          SELECT
            s.id,
            s.name,
            s."startDate",
            s."endDate",
            COUNT(DISTINCT c.id)::int        AS course_count,
            COUNT(DISTINCT e.id)::int        AS event_count,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', c.id,
                  'name', c.name,
                  'code', c.code,
                  'color', c.color
                )
              ) FILTER (WHERE c.id IS NOT NULL),
              '[]'
            ) AS course_colors
          FROM semesters s
          LEFT JOIN courses c ON c."semesterId" = s.id
          LEFT JOIN events  e ON e."semesterId" = s.id
          WHERE s."userId" = ${userId}
            AND s."isActive" = true
          GROUP BY s.id, s.name, s."startDate", s."endDate"
          ORDER BY s."startDate" DESC
          LIMIT 3
        `.then(rows => rows.map(mapRawSemester))
      ),
    [`semesters:active:${userId}`],
    { tags: [TAGS.semesters(userId)], revalidate: 60 }
  )()

export const getCourses = (userId: string) =>
  unstable_cache(
    () =>
      timed('getCourses', () =>
        prisma.course.findMany({
          where: { userId },
          include: {
            semester: { select: { name: true } },
            _count: { select: { events: true } },
          },
          orderBy: [{ semester: { startDate: 'desc' } }, { name: 'asc' }],
        })
      ),
    [`courses:${userId}`],
    { tags: [TAGS.courses(userId)], revalidate: 60 }
  )()

export const getUpcomingEvents = (userId: string) =>
  unstable_cache(
    () =>
      timed('getUpcomingEvents', () =>
        prisma.event.findMany({
          where: { userId, isDone: false, startAt: { gte: new Date() } },
          select: {
            id: true,
            title: true,
            type: true,
            startAt: true,
            course: { select: { name: true, code: true, color: true } },
          },
          orderBy: { startAt: 'asc' },
          take: 8,
        })
      ),
    [`events:upcoming:${userId}`],
    { tags: [TAGS.events(userId)], revalidate: 30 }
  )()

export const getEvent = (userId: string, eventId: string) =>
  unstable_cache(
    async () => {
      console.log(`[cache] MISS  event:${userId}:${eventId}`)
      const rows = await prisma.$queryRaw<RawEventRow[]>`
        SELECT
          e.*,
          c.id        AS course_id,
          c.name      AS course_name,
          c.code      AS course_code,
          c.color     AS course_color,
          s.id        AS semester_id,
          s.name      AS semester_name
        FROM events e
        JOIN courses c  ON c.id = e."courseId"
        JOIN semesters s ON s.id = e."semesterId"
        WHERE e.id = ${eventId}
          AND e."userId" = ${userId}
        LIMIT 1
      `
      if (!rows.length) return null
      return mapRawEvent(rows[0])
    },
    [`event:${userId}:${eventId}`],
    { tags: [TAGS.events(userId)], revalidate: 30 }
  )()

export const getTimelineEvents = (userId: string, limit = 500) =>
  unstable_cache(
    () =>
      timed('getTimelineEvents', () =>
        prisma.$queryRaw<RawTimelineRow[]>`
          SELECT
            e.id,
            e.title,
            e.type::text,
            e."startAt",
            e."isAllDay",
            e."isDone",
            c.id    AS course_id,
            c.name  AS course_name,
            c.code  AS course_code,
            c.color AS course_color,
            s.id    AS semester_id,
            s.name  AS semester_name
          FROM events e
          JOIN courses c ON c.id = e."courseId"
          JOIN semesters s ON s.id = e."semesterId"
          WHERE e."userId" = ${userId}
          ORDER BY e."startAt" ASC
          LIMIT ${limit}
        `.then(rows => rows.map(mapRawTimelineEvent))
      ),
    [`timeline:${userId}:${limit}`],
    { tags: [TAGS.events(userId), TAGS.courses(userId), TAGS.semesters(userId)], revalidate: 30 }
  )()
