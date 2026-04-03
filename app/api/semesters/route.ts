import { NextRequest } from 'next/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { TAGS } from '@/lib/queries'
import { z } from 'zod'

type RawSemesterRow = {
  id: string
  userId: string
  name: string
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  courses_count: bigint
  events_count: bigint
}

const CreateSemesterSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  endDate: z.string().datetime({ offset: true }).or(z.string().date()),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const cacheKey = `api:semesters:${auth.userId}`
  const fetchSemesters = unstable_cache(
    async () => {
      const rows = await prisma.$queryRaw<RawSemesterRow[]>`
        SELECT
          s.id,
          s."userId",
          s.name,
          s."startDate",
          s."endDate",
          s."isActive",
          s."createdAt",
          s."updatedAt",
          (
            SELECT COUNT(*)::bigint
            FROM courses c
            WHERE c."semesterId" = s.id
          ) AS courses_count,
          (
            SELECT COUNT(*)::bigint
            FROM events e
            WHERE e."semesterId" = s.id
          ) AS events_count
        FROM semesters s
        WHERE s."userId" = ${auth.userId}
        ORDER BY s."startDate" DESC
      `

      return rows.map(row => ({
        id: row.id,
        userId: row.userId,
        name: row.name,
        startDate: row.startDate,
        endDate: row.endDate,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        _count: {
          courses: Number(row.courses_count),
          events: Number(row.events_count),
        },
      }))
    },
    [cacheKey],
    { tags: [TAGS.semesters(auth.userId)], revalidate: 30 }
  )

  const semesters = await fetchSemesters()

  return ok(semesters)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const parsed = CreateSemesterSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const { name, startDate, endDate, isActive } = parsed.data
  const semester = await prisma.semester.create({
    data: {
      userId: auth.userId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive ?? true,
    },
  })
  revalidateTag(TAGS.semesters(auth.userId), { expire: 0 })
  return ok(semester, 201)
}
