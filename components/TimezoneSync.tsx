'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  TIMEZONE_COOKIE,
  TIMEZONE_MANUAL_COOKIE,
  TIMEZONE_PERSISTED_KEY,
  getBrowserTimezone,
  parseTimezoneCookie,
  setTimezoneCookies,
} from '@/lib/dates'

function readCookie(name: string) {
  const raw = document.cookie
    .split('; ')
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
  return raw ? decodeURIComponent(raw) : undefined
}

// TIMEZONE_PERSISTED_KEY remembers which timezone was last saved to the profile,
// so the PUT only happens when it changes rather than on every page load.
function readPersisted() {
  try {
    return localStorage.getItem(TIMEZONE_PERSISTED_KEY)
  } catch {
    return null
  }
}

function writePersisted(timeZone: string) {
  try {
    localStorage.setItem(TIMEZONE_PERSISTED_KEY, timeZone)
  } catch {
    // storage unavailable (private mode); we'll just persist again next load
  }
}

export function TimezoneSync() {
  const router = useRouter()
  const pathname = usePathname()
  const didRefresh = useRef(false)
  const persisting = useRef(false)

  useEffect(() => {
    if (readCookie(TIMEZONE_MANUAL_COOKIE) === '1') return

    const timeZone = getBrowserTimezone()
    const current = parseTimezoneCookie(readCookie(TIMEZONE_COOKIE))
    if (current !== timeZone) {
      setTimezoneCookies(timeZone, false)
      if (!didRefresh.current) {
        didRefresh.current = true
        router.refresh()
      }
    }

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
    if (isAuthRoute || persisting.current || readPersisted() === timeZone) return
    persisting.current = true
    fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: timeZone }),
    })
      .then(res => {
        if (res.ok) writePersisted(timeZone)
      })
      .catch(() => {})
      .finally(() => {
        persisting.current = false
      })
  }, [pathname, router])

  return null
}
