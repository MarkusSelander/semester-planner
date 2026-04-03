'use client'

import { useEffect } from 'react'

export function TimelineScroller({ currentMonthKey }: { currentMonthKey: string }) {
  useEffect(() => {
    const el = document.getElementById(currentMonthKey)
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [currentMonthKey])

  return null
}
