import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, err } from '@/lib/api'

function icsDate(date: Date, allDay: boolean): string {
  if (allDay) {
    return date.toISOString().slice(0, 10).replace(/-/g, '')
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsEscape(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  // ICS spec: lines must be ≤75 octets, fold with CRLF + space
  const chunks: string[] = []
  while (line.length > 75) {
    chunks.push(line.slice(0, 75))
    line = ' ' + line.slice(75)
  }
  chunks.push(line)
  return chunks.join('\r\n')
}

export async function GET(req: NextRequest) {
  const auth = await getAuthUserId()
  if ('error' in auth) return auth.error

  const semesterId = req.nextUrl.searchParams.get('semesterId')

  const events = await prisma.event.findMany({
    where: {
      userId: auth.userId,
      ...(semesterId ? { semesterId } : {}),
    },
    include: {
      course: { select: { name: true, code: true } },
      semester: { select: { name: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Semester Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const ev of events) {
    const courseLabel = ev.course.code ?? ev.course.name
    const endDate = ev.endAt ?? new Date(ev.startAt.getTime() + 60 * 60 * 1000)

    lines.push('BEGIN:VEVENT')
    lines.push(foldLine(`UID:${ev.id}@semester-planner`))

    if (ev.isAllDay) {
      lines.push(foldLine(`DTSTART;VALUE=DATE:${icsDate(ev.startAt, true)}`))
      lines.push(foldLine(`DTEND;VALUE=DATE:${icsDate(endDate, true)}`))
    } else {
      lines.push(foldLine(`DTSTART:${icsDate(ev.startAt, false)}`))
      lines.push(foldLine(`DTEND:${icsDate(endDate, false)}`))
    }

    lines.push(foldLine(`SUMMARY:${icsEscape(`[${courseLabel}] ${ev.title}`)}`))

    const descParts: string[] = [`Type: ${ev.type}`, `Semester: ${ev.semester.name}`]
    if (ev.description) descParts.push(ev.description)
    if (ev.notes) descParts.push(`Notes: ${ev.notes}`)
    if (ev.url) descParts.push(`URL: ${ev.url}`)
    lines.push(foldLine(`DESCRIPTION:${icsEscape(descParts.join('\\n'))}`))

    if (ev.location) lines.push(foldLine(`LOCATION:${icsEscape(ev.location)}`))
    if (ev.url) lines.push(foldLine(`URL:${ev.url}`))

    lines.push(foldLine(`DTSTAMP:${icsDate(new Date(), false)}`))
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  const ics = lines.join('\r\n')
  const filename = semesterId ? `semester-events.ics` : `all-events.ics`

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
