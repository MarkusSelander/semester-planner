import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { TAGS } from '@/lib/queries'
import { z } from 'zod'

const CreateCourseSchema = z.object({
  semesterId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function GET(req: NextRequest) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const semesterId = req.nextUrl.searchParams.get('semesterId')
  const courses = await prisma.course.findMany({
    where: {
      userId: auth.userId,
      ...(semesterId ? { semesterId } : {}),
    },
    include: { _count: { select: { events: true } }, semester: { select: { name: true } } },
    orderBy: [{ semester: { startDate: 'desc' } }, { name: 'asc' }],
  })
  return ok(courses)
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const parsed = CreateCourseSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  // Verify semester belongs to user
  const semester = await prisma.semester.findFirst({
    where: { id: parsed.data.semesterId, userId: auth.userId },
  })
  if (!semester) return err('Semester not found', 404)

  const course = await prisma.course.create({
    data: { ...parsed.data, userId: auth.userId, color: parsed.data.color ?? '#3B82F6' },
  })
  revalidateTag(TAGS.courses(auth.userId), { expire: 0 })
  revalidateTag(TAGS.semesters(auth.userId), { expire: 0 })
  return ok(course, 201)
}
