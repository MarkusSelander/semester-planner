'use client'

import { useEffect } from 'react'

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('[app error boundary]', error)
    console.error('[component stack]', error.stack)
  }, [error])

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="page-kicker">Error</p>
      <h2 className="page-title">Something broke.</h2>
      <p className="mt-3 text-sm text-muted-foreground">Reload the page. If it persists, check the console.</p>
      <pre className="mt-6 overflow-auto border border-border bg-muted/40 p-4 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
        {error.message}
      </pre>
    </div>
  )
}
