import { cache } from 'react'
import { prisma } from './prisma'
import { TAGS, cachedQuery, toDate } from './cache'

export { TAGS, invalidateUserCache } from './cache'

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

function timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === 'production') return fn()
  const t0 = Date.now()
  return fn().then(result => {
    console.log(`[query] ${name}: ${Date.now() - t0}ms`)
    return result
  })
}

export const getSemesters = cache((userId: string) =>
  cachedQuery(
    [`semesters:${userId}`],
    [TAGS.semesters(userId)],
    60,
    () =>
      timed('getSemesters', () =>
        prisma.semester.findMany({
          where: { userId },
          include: {
            _count: { select: { courses: true, events: true } },
            courses: { select: { id: true, color: true }, take: 6 },
          },
          orderBy: { startDate: 'desc' },
        })
      )
  ).then(rows =>
    rows.map(semester => ({
      ...semester,
      startDate: toDate(semester.startDate),
      endDate: toDate(semester.endDate),
    }))
  )
)

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

export const getActiveSemesters = cache((userId: string) =>
  cachedQuery(
    [`semesters:active:${userId}`],
    [TAGS.semesters(userId)],
    60,
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
      )
  ).then(rows =>
    rows.map(semester => ({
      ...semester,
      startDate: toDate(semester.startDate),
      endDate: toDate(semester.endDate),
    }))
  )
)

export const getCourses = cache((userId: string, semesterId?: string) =>
  cachedQuery(
    [`courses:${userId}:${semesterId ?? ''}`],
    [TAGS.courses(userId), TAGS.semesters(userId)],
    60,
    () =>
      timed('getCourses', () =>
        prisma.course.findMany({
          where: {
            userId,
            ...(semesterId ? { semesterId } : {}),
          },
          include: {
            semester: { select: { name: true } },
            _count: { select: { events: true } },
          },
          orderBy: [{ semester: { startDate: 'desc' } }, { name: 'asc' }],
        })
      )
  )
)

export const getUpcomingEvents = cache((userId: string) =>
  cachedQuery(
    [`events:upcoming:${userId}`],
    [TAGS.events(userId)],
    30,
    () =>
      timed('getUpcomingEvents', () =>
        prisma.event.findMany({
          where: { userId, isDone: false, startAt: { gte: new Date() } },
          select: {
            id: true,
            title: true,
            type: true,
            startAt: true,
            isAllDay: true,
            course: { select: { name: true, code: true, color: true } },
          },
          orderBy: { startAt: 'asc' },
          take: 8,
        })
      )
  ).then(events =>
    events.map(event => ({
      ...event,
      type: String(event.type),
      startAt: toDate(event.startAt),
    }))
  )
)

export const getEvent = cache((userId: string, eventId: string) =>
  cachedQuery(
    [`event:${userId}:${eventId}`],
    [TAGS.events(userId)],
    30,
    async () => {
      if (process.env.NODE_ENV !== 'production') console.log(`[cache] MISS  event:${userId}:${eventId}`)
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
    }
  ).then(event => {
    if (!event) return null
    return {
      ...event,
      startAt: toDate(event.startAt),
      endAt: event.endAt ? toDate(event.endAt) : null,
      doneAt: event.doneAt ? toDate(event.doneAt) : null,
      createdAt: toDate(event.createdAt),
      updatedAt: toDate(event.updatedAt),
    }
  })
)

export type ListEvent = {
  id: string
  title: string
  type: string
  startAt: string
  isDone: boolean
  isAllDay: boolean
  course: { id: string; name: string; code: string | null; color: string }
}

export const getFilteredEvents = cache((
  userId: string,
  filters: { semesterId?: string; type?: string; types?: string[]; done?: string }
): Promise<ListEvent[]> => {
  const key = `events:list:${userId}:${filters.semesterId ?? ''}:${filters.type ?? ''}:${(filters.types ?? []).join(',')}:${filters.done ?? ''}`
  return cachedQuery(
    [key],
    [TAGS.events(userId)],
    30,
    async () => {
      const rows = await prisma.event.findMany({
        where: {
          userId,
          ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
          ...(filters.types?.length
            ? { type: { in: filters.types as any[] } }
            : filters.type ? { type: filters.type as any } : {}),
          ...(filters.done !== undefined && filters.done !== ''
            ? { isDone: filters.done === 'true' }
            : {}),
        },
        select: {
          id: true,
          title: true,
          type: true,
          startAt: true,
          isDone: true,
          isAllDay: true,
          course: { select: { id: true, name: true, code: true, color: true } },
        },
        orderBy: { startAt: 'asc' },
        take: 500,
      })
      return rows.map(e => ({
        id: e.id,
        title: e.title,
        type: String(e.type),
        startAt: e.startAt.toISOString(),
        isDone: e.isDone,
        isAllDay: e.isAllDay,
        course: e.course,
      }))
    }
  )
})

export const getTimelineEvents = cache((userId: string, limit = 500) =>
  cachedQuery(
    [`timeline:${userId}:${limit}`],
    [TAGS.events(userId), TAGS.courses(userId), TAGS.semesters(userId)],
    30,
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
      )
  ).then(events =>
    events.map(event => ({
      ...event,
      startAt: toDate(event.startAt),
    }))
  )
)

export const getCourse = cache(async (userId: string, courseId: string) => {
  const course = await cachedQuery(
    [`course:${userId}:${courseId}`],
    [TAGS.courses(userId), TAGS.events(userId), TAGS.semesters(userId)],
    30,
    () =>
      timed('getCourse', () =>
        prisma.course.findFirst({
          where: { id: courseId, userId },
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            semester: { select: { id: true, name: true } },
            events: {
              orderBy: { startAt: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                startAt: true,
                isDone: true,
                isAllDay: true,
              },
            },
          },
        })
      )
  )
  if (!course) return null
  return {
    ...course,
    events: course.events.map(event => ({
      ...event,
      type: String(event.type),
      startAt: toDate(event.startAt),
      isAllDay: event.isAllDay,
    })),
  }
})

export const getCourseMeta = cache((userId: string, courseId: string) =>
  cachedQuery(
    [`course:meta:${userId}:${courseId}`],
    [TAGS.courses(userId)],
    60,
    () =>
      prisma.course.findFirst({
        where: { id: courseId, userId },
        select: { id: true, name: true, code: true, color: true, semesterId: true },
      })
  )
)

export const getSemester = cache(async (userId: string, semesterId: string) => {
  const semester = await cachedQuery(
    [`semester:${userId}:${semesterId}`],
    [TAGS.semesters(userId), TAGS.courses(userId), TAGS.events(userId)],
    30,
    () =>
      timed('getSemester', () =>
        prisma.semester.findFirst({
          where: { id: semesterId, userId },
          include: {
            courses: {
              include: { _count: { select: { events: true } } },
              orderBy: { name: 'asc' },
            },
            events: {
              where: { isDone: false, startAt: { gte: new Date() } },
              include: { course: { select: { name: true, code: true, color: true } } },
              orderBy: { startAt: 'asc' },
              take: 10,
            },
            _count: { select: { events: true } },
          },
        })
      )
  )
  if (!semester) return null
  return {
    ...semester,
    startDate: toDate(semester.startDate),
    endDate: toDate(semester.endDate),
    events: semester.events.map(event => ({
      ...event,
      startAt: toDate(event.startAt),
    })),
  }
})

export const getSemesterMeta = cache((userId: string, semesterId: string) =>
  cachedQuery(
    [`semester:meta:${userId}:${semesterId}`],
    [TAGS.semesters(userId)],
    60,
    () =>
      prisma.semester.findFirst({
        where: { id: semesterId, userId },
        select: { id: true, name: true, startDate: true, endDate: true, isActive: true },
      })
  ).then(semester =>
    semester
      ? {
          ...semester,
          startDate: toDate(semester.startDate).toISOString(),
          endDate: toDate(semester.endDate).toISOString(),
        }
      : null
  )
)

export type CalendarEvent = {
  id: string
  title: string
  startAt: string
  endAt: string | null
  isAllDay: boolean
  type: string
  course: { color: string; name: string; code: string | null }
}

export const getCalendarEvents = cache((userId: string): Promise<CalendarEvent[]> =>
  cachedQuery(
    [`events:calendar:${userId}`],
    [TAGS.events(userId), TAGS.courses(userId)],
    30,
    async () => {
      const rows = await prisma.event.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          isAllDay: true,
          type: true,
          course: { select: { color: true, name: true, code: true } },
        },
        orderBy: { startAt: 'asc' },
        take: 500,
      })
      return rows.map(event => ({
        id: event.id,
        title: event.title,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt?.toISOString() ?? null,
        isAllDay: event.isAllDay,
        type: String(event.type),
        course: event.course,
      }))
    }
  )
)

export const getUserProfile = cache((userId: string) =>
  cachedQuery(
    [`user:${userId}`],
    [TAGS.user(userId)],
    60,
    () => prisma.user.findUnique({ where: { id: userId } })
  )
)

export const getCourseEvents = cache((userId: string, courseId: string) =>
  cachedQuery(
    [`events:course:${userId}:${courseId}`],
    [TAGS.events(userId)],
    30,
    () =>
      prisma.event.findMany({
        where: { courseId, userId },
        orderBy: { startAt: 'asc' },
        select: {
          id: true,
          title: true,
          type: true,
          startAt: true,
          endAt: true,
          isAllDay: true,
          isDone: true,
        },
      })
  ).then(events =>
    events.map(event => ({
      ...event,
      type: String(event.type),
      startAt: toDate(event.startAt).toISOString(),
      endAt: event.endAt ? toDate(event.endAt).toISOString() : null,
    }))
  )
)
