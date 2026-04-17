'use client'

import { useCallback, useMemo, useReducer } from 'react'
import type { MenuItem } from '@/lib/mock-data'
import { DEFAULT_MENU_CONFIG, type MenuConfig } from '@/lib/menu-config/types'

export const WIZARD_STEPS = ['upload', 'style', 'enrich', 'design', 'export'] as const
export type WizardStepKey = (typeof WIZARD_STEPS)[number]

export const EXPORT_KEYS = ['pdf', 'qr', 'social', 'kit', 'fulfillment', 'translations'] as const
export type ExportKey = (typeof EXPORT_KEYS)[number]

export interface VariantMeta {
  id: string
  label: string
  tagline: string
}

export type PredictionStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'

export interface PredictionSlot {
  id: string
  variant: VariantMeta
  status: PredictionStatus
  imageUrl: string | null
  error: string | null
}

export interface WizardState {
  stepIndex: number
  /* Step 1 */
  uploaded: boolean
  extracting: boolean
  items: MenuItem[]
  /* Step 2 — full menu configuration (see lib/menu-config/types.ts) */
  config: MenuConfig
  /* Step 3 */
  autoDescriptions: boolean
  dietaryDetection: boolean
  chefsPick: boolean
  addOnLanguage: boolean
  addOnPhotos: boolean
  /* Step 4 — real Replicate predictions */
  predictions: PredictionSlot[]
  generationStarted: boolean
  generationError: string | null
  selectedPredictionIndex: number | null
  /* Step 5 */
  exports: Set<ExportKey>
}

type Action =
  | { type: 'goto'; index: number }
  | { type: 'upload-start' }
  | { type: 'upload-complete'; items: MenuItem[] }
  | { type: 'set'; patch: Partial<WizardState> }
  | { type: 'set-config'; patch: Partial<MenuConfig> }
  | { type: 'toggle-export'; key: ExportKey }
  | { type: 'generation-started'; predictions: PredictionSlot[] }
  | { type: 'generation-error'; error: string }
  | { type: 'generation-reset' }
  | { type: 'prediction-update'; index: number; patch: Partial<PredictionSlot> }
  | { type: 'select-prediction'; index: number | null }

const initialState: WizardState = {
  stepIndex: 0,
  uploaded: false,
  extracting: false,
  items: [],
  config: DEFAULT_MENU_CONFIG,
  autoDescriptions: true,
  dietaryDetection: true,
  chefsPick: false,
  addOnLanguage: false,
  addOnPhotos: false,
  predictions: [],
  generationStarted: false,
  generationError: null,
  selectedPredictionIndex: null,
  exports: new Set(['pdf', 'qr']),
}

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'goto':
      return { ...state, stepIndex: Math.max(0, Math.min(action.index, WIZARD_STEPS.length - 1)) }
    case 'upload-start':
      return { ...state, extracting: true, uploaded: false, items: [] }
    case 'upload-complete': {
      const seen = new Set<string>()
      const sections: string[] = []
      for (const item of action.items) {
        const cat = item.category?.trim()
        if (cat && !seen.has(cat)) {
          seen.add(cat)
          sections.push(cat)
        }
      }
      return {
        ...state,
        extracting: false,
        uploaded: true,
        items: action.items,
        config: {
          ...state.config,
          structure: { ...state.config.structure, sections },
        },
      }
    }
    case 'generation-started':
      return {
        ...state,
        generationStarted: true,
        generationError: null,
        predictions: action.predictions,
        selectedPredictionIndex: null,
      }
    case 'generation-error':
      return { ...state, generationError: action.error }
    case 'generation-reset':
      return {
        ...state,
        generationStarted: false,
        generationError: null,
        predictions: [],
        selectedPredictionIndex: null,
      }
    case 'prediction-update': {
      const next = state.predictions.map((p, i) =>
        i === action.index ? { ...p, ...action.patch } : p,
      )
      return { ...state, predictions: next }
    }
    case 'select-prediction':
      return { ...state, selectedPredictionIndex: action.index }
    case 'toggle-export': {
      const next = new Set(state.exports)
      if (next.has(action.key)) next.delete(action.key)
      else next.add(action.key)
      return { ...state, exports: next }
    }
    case 'set':
      return { ...state, ...action.patch }
    case 'set-config':
      return { ...state, config: { ...state.config, ...action.patch } }
    default:
      return state
  }
}

export function useWizard() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const goNext = useCallback(
    () => dispatch({ type: 'goto', index: state.stepIndex + 1 }),
    [state.stepIndex],
  )
  const goBack = useCallback(
    () => dispatch({ type: 'goto', index: state.stepIndex - 1 }),
    [state.stepIndex],
  )
  const goTo = useCallback((index: number) => dispatch({ type: 'goto', index }), [])

  const [canContinue, blockKey] = useMemo(() => {
    switch (WIZARD_STEPS[state.stepIndex]) {
      case 'upload':
        return [state.uploaded && state.items.length > 0, 'upload'] as const
      case 'style': {
        const c = state.config
        return [
          c.restaurantName.trim().length > 0 &&
            c.cuisines.length > 0 &&
            !!c.restaurantType &&
            !!c.vibe &&
            !!c.palette &&
            !!c.copyTone,
          'style',
        ] as const
      }
      case 'enrich':
        return [true, null] as const
      case 'design':
        return [state.selectedPredictionIndex !== null, 'design'] as const
      case 'export':
        return [state.exports.size > 0, 'export'] as const
      default:
        return [false, null] as const
    }
  }, [state])

  return { state, dispatch, goNext, goBack, goTo, canContinue, blockKey }
}
