'use client'

import { useEffect } from 'react'

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('[app error boundary]', error)
    console.error('[component stack]', error.stack)
  }, [error])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-red-600 mb-2">Runtime Error</h2>
      <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap">
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
    </div>
  )
}
