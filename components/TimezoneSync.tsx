'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  TIMEZONE_COOKIE,
  TIMEZONE_MANUAL_COOKIE,
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

export function TimezoneSync() {
  const router = useRouter()
  const pathname = usePathname()
  const didRefresh = useRef(false)
  const didPersist = useRef(false)

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
    if (isAuthRoute || didPersist.current) return
    didPersist.current = true
    fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: timeZone }),
    }).catch(() => {
      didPersist.current = false
    })
  }, [pathname, router])

  return null
}
