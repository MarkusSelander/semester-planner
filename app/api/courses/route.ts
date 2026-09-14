import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { getCourses } from '@/lib/queries'
import { invalidateUserCache } from '@/lib/cache'
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

  const semesterId = req.nextUrl.searchParams.get('semesterId') ?? undefined
  const courses = await getCourses(auth.userId, semesterId)
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
  invalidateUserCache(auth.userId, ['courses', 'semesters'])
  return ok(course, 201)
}
