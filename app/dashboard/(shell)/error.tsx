'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[dashboard] route error:', error)
  }, [error])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="bg-amber-l text-pill-amber-fg ring-amber/30 flex h-12 w-12 items-center justify-center rounded-2xl ring-1">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <h1 className="font-display text-text mt-5 text-xl font-bold">Something broke on our end</h1>
      <p className="text-text2 mt-2 text-sm">
        We&rsquo;ve logged the error. Try again — and if it keeps happening, refresh the page.
      </p>
      {error.digest && <p className="text-text3 mt-3 font-mono text-[11px]">ref: {error.digest}</p>}
      <Button onClick={reset} className="bg-g800 hover:bg-g700 mt-6 text-white">
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </Button>
    </div>
  )
}
