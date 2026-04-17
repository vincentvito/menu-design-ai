'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Brush, AlertCircle, RefreshCw } from 'lucide-react'
import { WizardStep } from '@/components/wizard/WizardShell'
import { LiveDesignGrid } from '@/components/wizard/LiveDesignGrid'
import { Button } from '@/components/ui/button'
import type { PredictionSlot, WizardState } from '../useWizard'

interface Props {
  state: WizardState
  dispatch: React.Dispatch<any>
}

const POLL_INTERVAL_MS = 1500

interface GenerateResponse {
  predictions: Array<{
    id: string
    status: PredictionSlot['status']
    output: string | null
    error: string | null
    variant: PredictionSlot['variant']
  }>
}

interface PredictionResponse {
  status: PredictionSlot['status']
  // Replicate output shape varies per model: single URL string, array of URLs,
  // or null while still processing.
  output: string | string[] | null
  error: string | null
}

function extractImageUrl(output: PredictionResponse['output']): string | null {
  if (!output) return null
  if (typeof output === 'string') return output
  return output[0] ?? null
}

async function createPredictions(
  config: WizardState['config'],
  items: WizardState['items'],
): Promise<PredictionSlot[]> {
  const res = await fetch('/api/predictions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ config, items }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null
    throw new Error(body?.detail || `Generation failed (${res.status})`)
  }
  const data = (await res.json()) as GenerateResponse
  return data.predictions.map((p) => ({
    id: p.id,
    variant: p.variant,
    status: p.status,
    imageUrl: p.output ?? null,
    error: p.error ?? null,
  }))
}

export function Step4Designs({ state, dispatch }: Props) {
  const t = useTranslations('Wizard.design')
  const didStart = useRef(false)
  const pollingIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (state.generationStarted || didStart.current) return
    didStart.current = true
    ;(async () => {
      try {
        const predictions = await createPredictions(state.config, state.items)
        dispatch({ type: 'generation-started', predictions })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        dispatch({ type: 'generation-error', error: message })
      }
    })()
    // Only depend on generationStarted; config/items don't change mid-step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.generationStarted])

  const pollPrediction = useCallback(
    (predictionId: string, index: number) => {
      if (pollingIds.current.has(predictionId)) return
      pollingIds.current.add(predictionId)
      let cancelled = false

      const tick = async () => {
        if (cancelled) return
        try {
          const res = await fetch(`/api/predictions/${predictionId}`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = (await res.json()) as PredictionResponse
          if (cancelled) return
          const imageUrl = extractImageUrl(data.output)
          dispatch({
            type: 'prediction-update',
            index,
            patch: { status: data.status, imageUrl, error: data.error ?? null },
          })
          const terminal =
            data.status === 'succeeded' || data.status === 'failed' || data.status === 'canceled'
          if (!terminal) {
            setTimeout(tick, POLL_INTERVAL_MS)
          } else {
            pollingIds.current.delete(predictionId)
          }
        } catch {
          if (cancelled) return
          setTimeout(tick, POLL_INTERVAL_MS * 2)
        }
      }

      setTimeout(tick, POLL_INTERVAL_MS)
      return () => {
        cancelled = true
        pollingIds.current.delete(predictionId)
      }
    },
    [dispatch],
  )

  useEffect(() => {
    const cleanups: (() => void)[] = []
    state.predictions.forEach((p, i) => {
      const terminal = p.status === 'succeeded' || p.status === 'failed' || p.status === 'canceled'
      if (terminal || pollingIds.current.has(p.id)) return
      const cleanup = pollPrediction(p.id, i)
      if (cleanup) cleanups.push(cleanup)
    })
    return () => cleanups.forEach((fn) => fn())
  }, [state.predictions, pollPrediction])

  const retry = () => {
    didStart.current = false
    pollingIds.current.clear()
    dispatch({ type: 'generation-reset' })
  }

  const anyReady = state.predictions.some((p) => p.status === 'succeeded' && p.imageUrl)
  const allDone =
    state.generationStarted &&
    state.predictions.length > 0 &&
    state.predictions.every(
      (p) => p.status === 'succeeded' || p.status === 'failed' || p.status === 'canceled',
    )
  const allFailed = allDone && !anyReady
  const waiting = !state.generationError && !state.generationStarted

  return (
    <WizardStep
      stepKey="design"
      title={t('title')}
      description={t('description', {
        restaurant: state.config.restaurantName.trim() || 'your menu',
      })}
    >
      {state.generationError ? (
        <div className="border-pill-red-fg/30 bg-pill-red-bg/30 flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center">
          <AlertCircle className="text-pill-red-fg size-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-display text-text text-sm font-semibold">Generation failed</p>
            <p className="text-text2 mt-1 text-xs">{state.generationError}</p>
          </div>
          <Button size="sm" variant="outline" onClick={retry}>
            <RefreshCw className="mr-1.5 size-3.5" />
            Try again
          </Button>
        </div>
      ) : waiting ? (
        <div
          role="status"
          aria-live="polite"
          className="border-brand-border bg-card flex min-h-[340px] flex-col items-center justify-center gap-3 rounded-2xl border p-10 text-center"
        >
          <Loader2 className="text-g800 size-6 animate-spin" aria-hidden="true" />
          <p className="text-text2 text-sm">Generating four designs… this takes about a minute</p>
        </div>
      ) : (
        <LiveDesignGrid
          predictions={state.predictions}
          selectedIndex={state.selectedPredictionIndex}
          onSelect={(i) => dispatch({ type: 'select-prediction', index: i })}
        />
      )}

      {allFailed && (
        <div className="border-pill-red-fg/30 bg-pill-red-bg/30 mt-4 flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center">
          <AlertCircle className="text-pill-red-fg size-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-display text-text text-sm font-semibold">All variants failed</p>
            <p className="text-text2 mt-1 text-xs">
              {state.predictions[0]?.error ?? 'The AI was unable to generate images. Try again.'}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={retry}>
            <RefreshCw className="mr-1.5 size-3.5" />
            Regenerate
          </Button>
        </div>
      )}

      {anyReady && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" onClick={retry}>
            <RefreshCw className="mr-1.5 size-3.5" />
            Regenerate
          </Button>
        </div>
      )}

      {anyReady && (
        <div className="border-amber/30 bg-amber-l mt-6 flex flex-col items-start gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center">
          <div className="bg-amber text-pill-amber-fg flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <Brush className="size-4" />
          </div>
          <div className="flex-1">
            <p className="font-display text-text text-sm font-semibold">{t('upsellTitle')}</p>
            <p className="text-text2 mt-1 text-xs">{t('upsellDescription')}</p>
          </div>
          <Button
            size="sm"
            className="bg-pill-amber-fg hover:bg-pill-amber-fg/90 self-start text-white sm:self-auto"
          >
            {t('upsellCta')}
          </Button>
        </div>
      )}
    </WizardStep>
  )
}
