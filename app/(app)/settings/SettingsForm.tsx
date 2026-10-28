'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'
import { InlineSpinner } from '@/components/shared/InlineSpinner'
import { Copy, RefreshCw } from 'lucide-react'
import { getBrowserTimezone, setTimezoneCookies } from '@/lib/dates'
import { PageShell } from '@/components/layout/PageShell'
import { ThemeToggle } from '@/components/theme-toggle'

const TIMEZONES = [
  'Europe/Oslo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
]

export type SettingsProfile = {
  fullName: string | null
  timezone: string
  emailReminders: boolean
  calendarToken: string | null
}

export function SettingsForm({ profile }: { profile: SettingsProfile }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [timezone, setTimezone] = useState(profile.timezone)
  const [deviceTimezone, setDeviceTimezone] = useState(profile.timezone)
  const [emailReminders, setEmailReminders] = useState(profile.emailReminders)
  const [loading, setLoading] = useState(false)
  const [calendarToken, setCalendarToken] = useState(profile.calendarToken)
  const [regenerating, setRegenerating] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setDeviceTimezone(getBrowserTimezone())
    setOrigin(window.location.origin)
  }, [])

  async function regenerateToken() {
    setRegenerating(true)
    try {
      const res = await fetch('/api/user/calendar-token', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error()
      setCalendarToken(json.data.calendarToken)
      toast.success('Calendar token regenerated')
    } catch {
      toast.error('Failed to regenerate token')
    } finally {
      setRegenerating(false)
    }
  }

  function copyFeedUrl() {
    if (!calendarToken) return
    const url = `${window.location.origin}/api/calendar/${calendarToken}`
    navigator.clipboard.writeText(url)
    toast.success('Feed URL copied!')
  }

  function openWebcal() {
    if (!calendarToken) return
    const url = `webcal://${window.location.host}/api/calendar/${calendarToken}`
    window.location.href = url
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName || undefined, timezone, emailReminders }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTimezoneCookies(timezone, timezone !== deviceTimezone)
      toast.success('Settings saved!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell width="narrow">
      <p className="page-kicker">Account</p>
      <h1 className="page-title mb-8">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section>
          <h2 className="field-label mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
              <select
                id="timezone"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="field-select"
              >
                {!TIMEZONES.includes(deviceTimezone) && (
                  <option value={deviceTimezone}>{deviceTimezone} (this device)</option>
                )}
                {TIMEZONES.map(zone => (
                  <option key={zone} value={zone}>
                    {zone}{zone === deviceTimezone ? ' (this device)' : ''}
                  </option>
                ))}
                {timezone && !TIMEZONES.includes(timezone) && timezone !== deviceTimezone && (
                  <option value={timezone}>{timezone}</option>
                )}
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Dates and times follow this timezone. It defaults to the timezone of the device you are using.
              </p>
              {timezone !== deviceTimezone && (
                <button
                  type="button"
                  onClick={() => setTimezone(deviceTimezone)}
                  className="mt-2 text-xs text-accent hover:underline"
                >
                  Use this device ({deviceTimezone})
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-border/70 pt-6">
          <h2 className="field-label mb-4">Appearance</h2>
          <div className="flex items-center justify-between rounded-sm border border-border/80 bg-card px-4 py-3">
            <p className="text-sm">Theme</p>
            <ThemeToggle />
          </div>
        </section>

        <section className="border-t border-border/70 pt-6">
          <h2 className="field-label mb-4">Notifications</h2>
          <div className="flex items-center justify-between rounded-sm border border-border/80 bg-card px-4 py-3">
            <div>
              <p className="text-sm">Email reminders</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get notified before upcoming exams and assignments</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailReminders(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailReminders ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  emailReminders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        <Button type="submit" disabled={loading} aria-busy={loading}>
          {loading ? <><InlineSpinner className="mr-1" /> Saving…</> : 'Save settings'}
        </Button>
      </form>

      <section className="border-t border-border/70 mt-8 pt-8">
        <h2 className="field-label mb-1">Calendar subscription</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Subscribe in Google Calendar, Apple Calendar, or Outlook — events sync automatically.
        </p>

        {calendarToken && (
          <div className="space-y-3">
            <Button onClick={openWebcal} className="w-full">
              Subscribe in Calendar app
            </Button>

            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-sm border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
                {`${origin}/api/calendar/${calendarToken}`}
              </code>
              <button
                onClick={copyFeedUrl}
                className="flex-shrink-0 rounded-sm border border-border p-2 hover:bg-muted/60"
                title="Copy URL"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              For Google Calendar: Other calendars → From URL → paste the URL above.
            </p>

            <button
              onClick={regenerateToken}
              disabled={regenerating}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate (invalidates current URL)
            </button>
          </div>
        )}
      </section>
    </PageShell>
  )
}
