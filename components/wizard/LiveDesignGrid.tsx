'use client'

import { Check, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PredictionSlot } from './useWizard'

interface Props {
  predictions: PredictionSlot[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export function LiveDesignGrid({ predictions, selectedIndex, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {predictions.map((p, i) => {
        const active = selectedIndex === i
        const isTerminal =
          p.status === 'succeeded' || p.status === 'failed' || p.status === 'canceled'
        const isReady = p.status === 'succeeded' && p.imageUrl
        const isError = p.status === 'failed' || p.status === 'canceled'
        const disabled = !isReady
        return (
          <button
            key={p.id || i}
            type="button"
            onClick={() => isReady && onSelect(i)}
            aria-pressed={active}
            disabled={disabled}
            className={cn(
              'group border-brand-border bg-card relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all',
              isReady && 'hover:shadow-md',
              active && 'ring-g800 border-g800 ring-2',
              disabled && 'cursor-default',
            )}
          >
            <div className="bg-cream/60 relative aspect-[3/4] w-full overflow-hidden">
              {isReady && p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={`${p.variant.label} design`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : isError ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                  <AlertCircle className="text-pill-red-fg size-5" />
                  <p className="text-text2 text-xs">
                    {p.error || 'This variant failed to generate.'}
                  </p>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <Loader2 className="text-g800 size-6 animate-spin" aria-hidden="true" />
                  <p className="text-text2 text-xs">
                    {p.status === 'starting' ? 'Queued…' : 'Generating…'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <h4 className="font-display text-text text-sm font-semibold">{p.variant.label}</h4>
                <p className="text-text3 mt-0.5 text-xs">{p.variant.tagline}</p>
              </div>
              {active && (
                <span className="bg-pill-green-bg text-pill-green-fg inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  <Check className="size-3" />
                  Selected
                </span>
              )}
              {!active && isTerminal && !isReady && (
                <span className="text-text3 text-[11px]">Unavailable</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
