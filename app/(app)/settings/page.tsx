'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Copy, RefreshCw } from 'lucide-react'
import { getBrowserTimezone, setTimezoneCookies } from '@/lib/dates'
import { FormPageSkeleton } from '@/components/shared/FormPageSkeleton'
import { labelClassName, selectClassName } from '@/lib/utils'

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

export default function SettingsPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [timezone, setTimezone] = useState('Europe/Oslo')
  const [deviceTimezone, setDeviceTimezone] = useState('Europe/Oslo')
  const [emailReminders, setEmailReminders] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [calendarToken, setCalendarToken] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    const detected = getBrowserTimezone()
    setDeviceTimezone(detected)
    Promise.all([
      fetch('/api/user/profile').then(r => r.json()),
      fetch('/api/user/calendar-token').then(r => r.json()),
    ]).then(([profile, cal]) => {
      if (profile.data) {
        setFullName(profile.data.fullName ?? '')
        setTimezone(profile.data.timezone ?? detected)
        setEmailReminders(profile.data.emailReminders ?? true)
      }
      if (cal.data) setCalendarToken(cal.data.calendarToken)
    }).finally(() => setFetching(false))
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

  if (fetching) return <FormPageSkeleton />

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className={labelClassName}>Full name</label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="timezone" className={labelClassName}>Timezone</label>
              <select
                id="timezone"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className={selectClassName}
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
              <p className="mt-1.5 text-xs text-slate-500">
                Dates and times follow this timezone. It defaults to the timezone of the device you are using.
              </p>
              {timezone !== deviceTimezone && (
                <button
                  type="button"
                  onClick={() => setTimezone(deviceTimezone)}
                  className="mt-2 text-xs text-indigo-600 hover:underline"
                >
                  Use this device ({deviceTimezone})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Notifications</h2>
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50">
            <div>
              <p id="email-reminders-label" className="text-sm font-medium text-slate-900">Email reminders</p>
              <p className="text-xs text-slate-500 mt-0.5">Get notified before upcoming exams and assignments</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailReminders}
              aria-labelledby="email-reminders-label"
              onClick={() => setEmailReminders(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                emailReminders ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  emailReminders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save settings'}
        </Button>
      </form>

      <div className="border-t border-slate-100 mt-8 pt-8">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">Calendar Subscription</h2>
        <p className="text-xs text-slate-500 mb-4">
          Subscribe in Google Calendar, Apple Calendar, or Outlook — events sync automatically.
        </p>

        {calendarToken && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openWebcal}
                className="flex-1 rounded-md bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition-colors"
              >
                Subscribe in Calendar app
              </button>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 truncate text-slate-600">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/${calendarToken}`}
              </code>
              <button
                type="button"
                onClick={copyFeedUrl}
                className="flex-shrink-0 p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                aria-label="Copy calendar feed URL"
                title="Copy URL"
              >
                <Copy className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              For Google Calendar: Other calendars → From URL → paste the URL above.
            </p>

            <button
              type="button"
              onClick={regenerateToken}
              disabled={regenerating}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate (invalidates current URL)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
