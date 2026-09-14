import { revalidateTag, unstable_cache } from 'next/cache'

export const TAGS = {
  semesters: (userId: string) => `semesters:${userId}`,
  courses: (userId: string) => `courses:${userId}`,
  events: (userId: string) => `events:${userId}`,
  user: (userId: string) => `user:${userId}`,
}

const IMMEDIATE = { expire: 0 } as const

export function invalidateUserCache(
  userId: string,
  scopes: Array<keyof typeof TAGS> = ['semesters', 'courses', 'events']
) {
  for (const scope of scopes) {
    revalidateTag(TAGS[scope](userId), IMMEDIATE)
  }
}

export function cachedQuery<T>(
  key: string[],
  tags: string[],
  revalidate: number,
  fn: () => Promise<T>
): Promise<T> {
  return unstable_cache(fn, key, { tags, revalidate })()
}

export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}
