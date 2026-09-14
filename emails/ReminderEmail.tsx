import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ReminderEmailProps {
  eventTitle: string
  eventType: string
  courseName: string
  courseCode?: string | null
  startAt: Date
  location?: string | null
  daysUntil: number
  appUrl: string
  eventId: string
  userName?: string | null
  timeZone?: string
}

export function ReminderEmail({
  eventTitle,
  eventType,
  courseName,
  courseCode,
  startAt,
  location,
  daysUntil,
  appUrl,
  eventId,
  userName,
  timeZone = 'UTC',
}: ReminderEmailProps) {
  const formattedDate = startAt.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  })
  const formattedTime = startAt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  })

  const preview = `${eventTitle} is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
  const courseDisplay = courseCode ? `${courseCode} — ${courseName}` : courseName

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px' }}>
          <Heading style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            Upcoming: {eventTitle}
          </Heading>
          <Text style={{ color: '#6b7280', fontSize: '14px', marginTop: 0 }}>
            {daysUntil === 0
              ? 'This is happening today!'
              : `This is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
          </Text>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

          <Section>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#6b7280', fontSize: '13px', paddingBottom: '12px', width: '120px' }}>Course</td>
                  <td style={{ color: '#111827', fontSize: '13px', fontWeight: '500', paddingBottom: '12px' }}>{courseDisplay}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', fontSize: '13px', paddingBottom: '12px' }}>Type</td>
                  <td style={{ color: '#111827', fontSize: '13px', fontWeight: '500', paddingBottom: '12px' }}>{eventType}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', fontSize: '13px', paddingBottom: '12px' }}>Date</td>
                  <td style={{ color: '#111827', fontSize: '13px', fontWeight: '500', paddingBottom: '12px' }}>{formattedDate}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', fontSize: '13px', paddingBottom: '12px' }}>Time</td>
                  <td style={{ color: '#111827', fontSize: '13px', fontWeight: '500', paddingBottom: '12px' }}>{formattedTime}</td>
                </tr>
                {location && (
                  <tr>
                    <td style={{ color: '#6b7280', fontSize: '13px', paddingBottom: '12px' }}>Location</td>
                    <td style={{ color: '#111827', fontSize: '13px', fontWeight: '500', paddingBottom: '12px' }}>{location}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

          <Link
            href={`${appUrl}/events/${eventId}`}
            style={{
              display: 'inline-block',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            View event
          </Link>

          <Text style={{ color: '#9ca3af', fontSize: '12px', marginTop: '32px' }}>
            You received this because email reminders are enabled in your{' '}
            <Link href={`${appUrl}/settings`} style={{ color: '#6b7280' }}>
              Semester Planner settings
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ReminderEmail
