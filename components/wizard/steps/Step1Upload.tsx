'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslations } from 'next-intl'
import {
  Camera,
  Cloud,
  FileSpreadsheet,
  Link as LinkIcon,
  Loader2,
  PencilLine,
  Type,
} from 'lucide-react'
import { WizardStep } from '@/components/wizard/WizardShell'
import { ExtractedItemsTable, DietaryLegend } from '@/components/wizard/ExtractedItemsTable'
import { SAMPLE_MENU_ITEMS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { WizardState } from '../useWizard'

interface Props {
  state: WizardState
  dispatch: React.Dispatch<any>
}

const EXTRACT_DELAY_MS = 1800

const ALT_PILLS = [
  { key: 'paste', Icon: Type },
  { key: 'csv', Icon: FileSpreadsheet },
  { key: 'manual', Icon: PencilLine },
  { key: 'url', Icon: LinkIcon },
] as const

export function Step1Upload({ state, dispatch }: Props) {
  const t = useTranslations('Wizard.upload')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear any pending mock-extraction timer when the step unmounts so dispatches
  // don't fire after navigation, and so rapid re-triggers don't stack.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const triggerExtraction = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    dispatch({ type: 'upload-start' })
    timeoutRef.current = setTimeout(() => {
      dispatch({ type: 'upload-complete', items: SAMPLE_MENU_ITEMS })
      timeoutRef.current = null
    }, EXTRACT_DELAY_MS)
  }, [dispatch])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
    noClick: false,
    onDropAccepted: triggerExtraction,
  })

  return (
    <WizardStep stepKey="upload" title={t('title')} description={t('description')}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        role="button"
        tabIndex={0}
        aria-label={t('drop')}
        aria-busy={state.extracting}
        className={cn(
          'border-brand-border bg-card relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all',
          isDragActive && 'border-g800 bg-g50',
          state.extracting && 'cursor-wait opacity-80',
        )}
      >
        <input {...getInputProps()} aria-label={t('drop')} />

        {state.extracting ? (
          <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
            <Loader2 className="text-g800 size-8 animate-spin" aria-hidden="true" />
            <p className="text-text font-display text-base font-semibold">{t('extracting')}</p>
          </div>
        ) : (
          <>
            <div className="bg-g50 ring-g100 flex h-14 w-14 items-center justify-center rounded-2xl ring-1">
              <Camera className="text-g800 size-6 md:hidden" aria-hidden="true" />
              <Cloud className="text-g800 hidden size-6 md:block" aria-hidden="true" />
            </div>

            {/* Mobile-first copy */}
            <p className="font-display text-text mt-4 text-base font-semibold md:hidden">
              {t('mobileDrop')}
            </p>
            <p className="text-text2 mt-1 text-xs md:hidden">{t('mobileBrowse')}</p>

            {/* Desktop/drag-drop copy */}
            <p className="font-display text-text mt-4 hidden text-base font-semibold md:block">
              {t('drop')}
            </p>
            <p className="text-text2 mt-1 hidden text-xs md:block">{t('browse')}</p>

            {/* Alt input pills */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {ALT_PILLS.map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    triggerExtraction()
                  }}
                  className="border-brand-border text-text2 hover:bg-g50 hover:text-text inline-flex min-h-[40px] items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-sm font-medium transition-colors"
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {t(`alt.${key}`)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {state.uploaded && (
        <div className="mt-8 space-y-2" aria-live="polite">
          <p className="sr-only">{t('extracted', { count: state.items.length })}</p>
          <ExtractedItemsTable items={state.items} />
          <DietaryLegend />
        </div>
      )}
    </WizardStep>
  )
}
