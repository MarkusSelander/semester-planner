import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, ok, err } from '@/lib/api'
import { createRemindersForEvent } from '@/lib/reminders'
import { z } from 'zod'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const RequestSchema = z.object({
  semesterId: z.string().uuid(),
  courseIds: z.array(z.string().uuid()),
  pdfBase64: z.string(),
  fileName: z.string(),
})

const ExtractedEventSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  course_code: z.string().nullable().optional(),
  type: z.enum(['LECTURE', 'EXERCISE', 'ASSIGNMENT', 'EXAM', 'PROJECT', 'OTHER']),
  start_at: z.string(),
  end_at: z.string().nullable().optional(),
  is_all_day: z.boolean(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  location: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
})

const ClaudeResponseSchema = z.object({
  events: z.array(ExtractedEventSchema),
  extraction_notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const body = await req.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const { semesterId, courseIds, pdfBase64, fileName } = parsed.data

  // Verify semester belongs to user
  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId: auth.userId },
  })
  if (!semester) return err('Semester not found', 404)

  // Fetch courses for context
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds }, userId: auth.userId },
  })

  const user = await prisma.user.findUnique({ where: { id: auth.userId } })

  // Create import record
  const importRecord = await prisma.pdfImport.create({
    data: {
      userId: auth.userId,
      semesterId,
      originalName: fileName,
      status: 'PROCESSING',
    },
  })

  try {
    const courseList = courses
      .map((c) => `${c.code ? c.code + ' ' : ''}${c.name}`)
      .join(', ')

    const startDateStr = semester.startDate.toISOString().split('T')[0]
    const endDateStr = semester.endDate.toISOString().split('T')[0]

    const systemPrompt = `You are an academic calendar extraction assistant. Extract all scheduled events from a university semester schedule PDF and return them as structured JSON.

Rules:
- Always return valid JSON matching the schema exactly
- For recurring events (e.g. "Lecture every Tuesday 10:15-12:00"), expand each occurrence individually within the semester date range
- Infer the year from context (semester name, surrounding dates)
- Normalize all times to ISO 8601 format (e.g. "2025-01-15T10:15:00")
- If a time is not specified, set is_all_day: true and use "T00:00:00" as time
- Map event types strictly to: LECTURE | EXERCISE | ASSIGNMENT | EXAM | PROJECT | OTHER
- Set priority: EXAM and hard deadlines → HIGH, ASSIGNMENT/PROJECT → MEDIUM, LECTURE/EXERCISE → LOW
- For end_at: if duration is given use it; if it's an all-day deadline set end_at to same day T23:59:00
- Extract location if present (room numbers, building names)
- Extract any URLs (e.g. submission links) if present
- course_code should match one of the provided course codes exactly, or null if unknown`

    const userPrompt = `Extract all events from this semester schedule PDF.

Semester: "${semester.name}"
Date range: ${startDateStr} to ${endDateStr}
Courses: ${courseList || 'No courses provided - use null for course_code'}

Return ONLY a JSON object with this exact structure:
{
  "events": [
    {
      "title": "string",
      "description": "string or null",
      "course_code": "string matching one of the course codes, or null",
      "type": "LECTURE" | "EXERCISE" | "ASSIGNMENT" | "EXAM" | "PROJECT" | "OTHER",
      "start_at": "ISO 8601 datetime string",
      "end_at": "ISO 8601 datetime string or null",
      "is_all_day": boolean,
      "priority": "LOW" | "MEDIUM" | "HIGH",
      "location": "string or null",
      "url": "string or null"
    }
  ],
  "extraction_notes": "Brief summary of what was found and any ambiguities"
}`

    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64,
        },
      },
      systemPrompt + '\n\n' + userPrompt,
    ])

    const rawText = result.response.text()

    // Extract JSON from response (Claude may add markdown code blocks)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const rawResponse = JSON.parse(jsonMatch[0])
    const validated = ClaudeResponseSchema.safeParse(rawResponse)
    if (!validated.success) {
      throw new Error(`Invalid response format: ${validated.error.message}`)
    }

    const { events: extractedEvents } = validated.data

    // Build a map from course code → course id
    const courseCodeMap = new Map(
      courses.map((c) => [c.code?.toLowerCase() ?? '', c.id])
    )

    // Use first course as fallback if only one course
    const fallbackCourseId = courses.length === 1 ? courses[0].id : null

    // Filter events to those within semester range and map to DB format
    const semesterStart = semester.startDate
    const semesterEnd = semester.endDate

    const eventsToCreate = extractedEvents
      .filter((e) => {
        const d = new Date(e.start_at)
        return d >= semesterStart && d <= semesterEnd
      })
      .map((e) => {
        const courseId =
          courseCodeMap.get(e.course_code?.toLowerCase() ?? '') ??
          fallbackCourseId ??
          courses[0]?.id

        return {
          userId: auth.userId,
          semesterId,
          courseId,
          title: e.title,
          description: e.description ?? null,
          type: e.type,
          startAt: new Date(e.start_at),
          endAt: e.end_at ? new Date(e.end_at) : null,
          isAllDay: e.is_all_day,
          priority: e.priority,
          location: e.location ?? null,
          url: e.url ?? null,
          source: 'PDF_IMPORT' as const,
        }
      })
      .filter((e) => e.courseId) // only include events with a valid course

    // Bulk insert events
    await prisma.event.createMany({ data: eventsToCreate as any })

    // Fetch the created events to create reminders
    const createdEvents = await prisma.event.findMany({
      where: {
        userId: auth.userId,
        semesterId,
        source: 'PDF_IMPORT',
        createdAt: { gte: importRecord.createdAt },
      },
    })

    // Create reminders for each event
    for (const event of createdEvents) {
      await createRemindersForEvent(event, user?.emailReminders ?? true)
    }

    // Update import record
    await prisma.pdfImport.update({
      where: { id: importRecord.id },
      data: {
        status: 'COMPLETED',
        eventsCreated: createdEvents.length,
        rawResponse: rawResponse,
      },
    })

    return ok({
      importId: importRecord.id,
      eventsCreated: createdEvents.length,
      extractionNotes: validated.data.extraction_notes,
      events: eventsToCreate,
    }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await prisma.pdfImport.update({
      where: { id: importRecord.id },
      data: { status: 'FAILED', errorMessage: message },
    })
    return err(`Import failed: ${message}`, 500)
  }
}
