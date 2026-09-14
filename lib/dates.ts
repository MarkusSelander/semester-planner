import {
  differenceInDays,
  format,
  isThisWeek,
  isToday,
  isTomorrow,
} from 'date-fns'
import { TZDate, tz } from '@date-fns/tz'

export const TIMEZONE_COOKIE = 'sp-tz'
export const TIMEZONE_MANUAL_COOKIE = 'sp-tz-manual'
export const DEFAULT_TIMEZONE = 'Europe/Oslo'

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

export function getBrowserTimezone(): string {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
  return isValidTimeZone(detected) ? detected : DEFAULT_TIMEZONE
}

export function parseTimezoneCookie(value: string | undefined): string | null {
  if (!value) return null
  try {
    const timeZone = decodeURIComponent(value)
    return isValidTimeZone(timeZone) ? timeZone : null
  } catch {
    return isValidTimeZone(value) ? value : null
  }
}

function tzFn(timeZone: string) {
  return tz(isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIMEZONE)
}

/** All-day and date-only values are calendar dates, not instants. */
export function displayTimeZone(timeZone: string, isAllDay?: boolean) {
  return isAllDay ? 'UTC' : timeZone
}

export function formatTz(
  date: Date | string | number,
  pattern: string,
  timeZone: string,
) {
  return format(new Date(date), pattern, { in: tzFn(timeZone) })
}

export function formatEvent(
  date: Date | string | number,
  pattern: string,
  timeZone: string,
  isAllDay?: boolean,
) {
  return formatTz(date, pattern, displayTimeZone(timeZone, isAllDay))
}

export function formatDateOnly(date: Date | string | number, pattern: string) {
  return formatTz(date, pattern, 'UTC')
}

export function formatMonthHeading(monthKey: string, pattern = 'MMMM') {
  const [year, month] = monthKey.split('-').map(Number)
  return format(new Date(year, month - 1, 1), pattern)
}

export function monthKeyFor(
  date: Date | string | number,
  timeZone: string,
  isAllDay?: boolean,
) {
  return formatEvent(date, 'yyyy-MM', timeZone, isAllDay)
}

export function calendarDayKey(
  date: Date | string | number,
  timeZone: string,
  isAllDay?: boolean,
) {
  return formatEvent(date, 'yyyy-MM-dd', timeZone, isAllDay)
}

export function isTodayTz(date: Date | string | number, timeZone: string) {
  return isToday(new Date(date), { in: tzFn(timeZone) })
}

export function isTomorrowTz(date: Date | string | number, timeZone: string) {
  return isTomorrow(new Date(date), { in: tzFn(timeZone) })
}

export function isThisWeekTz(date: Date | string | number, timeZone: string) {
  return isThisWeek(new Date(date), { weekStartsOn: 1, in: tzFn(timeZone) })
}

export function differenceInDaysTz(
  date: Date | string | number,
  timeZone: string,
) {
  return differenceInDays(new Date(date), new Date(), { in: tzFn(timeZone) })
}

export function dateLabel(
  date: Date | string | number,
  timeZone: string,
  isAllDay?: boolean,
) {
  const zone = displayTimeZone(timeZone, isAllDay)
  const value = new Date(date)
  if (isTodayTz(value, zone)) return 'Today'
  if (isTomorrowTz(value, zone)) return 'Tomorrow'
  if (isThisWeekTz(value, zone)) return formatTz(value, 'EEEE', zone)
  return formatTz(value, 'd MMM', zone)
}

export function toDateInputValue(
  date: Date | string | number,
  timeZone: string,
  isAllDay?: boolean,
) {
  return formatEvent(date, 'yyyy-MM-dd', timeZone, isAllDay)
}

export function toTimeInputValue(date: Date | string | number, timeZone: string) {
  return formatTz(date, 'HH:mm', timeZone)
}

export function zonedDateTimeToISO(date: string, time: string, timeZone: string) {
  return new TZDate(`${date}T${time}:00`, timeZone).toISOString()
}

export function allDayToISO(date: string) {
  return `${date}T00:00:00.000Z`
}

export function setTimezoneCookies(timeZone: string, manual: boolean) {
  const encoded = encodeURIComponent(timeZone)
  document.cookie = `${TIMEZONE_COOKIE}=${encoded}; path=/; max-age=31536000; SameSite=Lax`
  document.cookie = manual
    ? `${TIMEZONE_MANUAL_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`
    : `${TIMEZONE_MANUAL_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}
