import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { ReminderEmail } from '@/emails/ReminderEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  // Find all unsent reminders that are due
  const reminders = await prisma.reminder.findMany({
    where: {
      sent: false,
      remindAt: {
        lte: now,
        gte: yesterday,
      },
    },
    include: {
      event: {
        include: {
          course: { select: { name: true, code: true, color: true } },
          semester: { select: { name: true } },
        },
      },
      user: { select: { email: true, emailReminders: true, fullName: true } },
    },
  })

  let sent = 0
  const errors: string[] = []

  for (const reminder of reminders) {
    if (!reminder.user.emailReminders) {
      // Mark as sent anyway to avoid re-processing
      await prisma.reminder.update({ where: { id: reminder.id }, data: { sent: true, sentAt: now } })
      continue
    }

    const daysUntil = Math.round(
      (reminder.event.startAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: reminder.user.email,
        subject: `Reminder: ${reminder.event.title} in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        react: ReminderEmail({
          eventTitle: reminder.event.title,
          eventType: reminder.event.type,
          courseName: reminder.event.course.name,
          courseCode: reminder.event.course.code,
          startAt: reminder.event.startAt,
          location: reminder.event.location,
          daysUntil,
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          eventId: reminder.event.id,
          userName: reminder.user.fullName,
        }),
      })

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sent: true, sentAt: now },
      })
      sent++
    } catch (error) {
      errors.push(`Reminder ${reminder.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return NextResponse.json({ sent, errors, total: reminders.length })
}
