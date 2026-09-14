import { cookies } from 'next/headers'
import {
  DEFAULT_TIMEZONE,
  TIMEZONE_COOKIE,
  parseTimezoneCookie,
} from '@/lib/dates'

export async function getRequestTimezone(): Promise<string> {
  const store = await cookies()
  return parseTimezoneCookie(store.get(TIMEZONE_COOKIE)?.value) ?? DEFAULT_TIMEZONE
}
