'use client'

import { useCallback, useRef, useState } from 'react'
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
  X,
} from 'lucide-react'
import { WizardStep } from '@/components/wizard/WizardShell'
import { ExtractedItemsTable, DietaryLegend } from '@/components/wizard/ExtractedItemsTable'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WizardState } from '../useWizard'
import type { MenuItem } from '@/lib/mock-data'

interface Props {
  state: WizardState
  dispatch: React.Dispatch<any>
}

const ALT_PILLS = [
  { key: 'paste', Icon: Type },
  { key: 'csv', Icon: FileSpreadsheet },
  { key: 'manual', Icon: PencilLine },
  { key: 'url', Icon: LinkIcon },
] as const

async function callExtract(body: object): Promise<MenuItem[]> {
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `Extract failed (${res.status})`)
  }
  const { items } = await res.json()
  return items
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function Step1Upload({ state, dispatch }: Props) {
  const t = useTranslations('Wizard.upload')
  const [pasteMode, setPasteMode] = useState(false)
  const [urlMode, setUrlMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const runExtraction = useCallback(
    async (body: object) => {
      setError(null)
      dispatch({ type: 'upload-start' })
      try {
        const items = await callExtract(body)
        if (items.length === 0) throw new Error('No menu items found — try pasting more text.')
        dispatch({ type: 'upload-complete', items })
        setPasteMode(false)
        setPasteText('')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Extraction failed'
        setError(msg)
        dispatch({ type: 'set', patch: { extracting: false } })
      }
    },
    [dispatch],
  )

  const onDropAccepted = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      const imageBase64 = await fileToBase64(file)
      await runExtraction({ imageBase64, mimeType: file.type })
    },
    [runExtraction],
  )

  const handlePasteSubmit = useCallback(async () => {
    const text = pasteText.trim()
    if (!text) return
    await runExtraction({ text })
  }, [pasteText, runExtraction])

  const handleUrlSubmit = useCallback(async () => {
    const url = urlValue.trim()
    if (!url) return
    await runExtraction({ url })
    setUrlValue('')
    setUrlMode(false)
  }, [urlValue, runExtraction])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
    disabled: state.extracting || pasteMode || urlMode,
    onDropAccepted,
  })

  return (
    <WizardStep stepKey="upload" title={t('title')} description={t('description')}>
      <div
        {...(pasteMode || urlMode ? {} : getRootProps())}
        role={pasteMode || urlMode ? undefined : 'button'}
        tabIndex={pasteMode || urlMode ? undefined : 0}
        aria-label={pasteMode || urlMode ? undefined : t('drop')}
        aria-busy={state.extracting}
        className={cn(
          'border-brand-border bg-card relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all',
          isDragActive && 'border-g800 bg-g50',
          state.extracting && 'cursor-wait opacity-80',
          (pasteMode || urlMode) && 'cursor-default items-stretch text-left',
        )}
      >
        {!pasteMode && !urlMode && <input {...getInputProps()} aria-label={t('drop')} />}

        {state.extracting ? (
          <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
            <Loader2 className="text-g800 size-8 animate-spin" aria-hidden="true" />
            <p className="text-text font-display text-base font-semibold">{t('extracting')}</p>
          </div>
        ) : urlMode ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-text text-sm font-semibold">Paste your menu URL</p>
              <button
                type="button"
                onClick={() => {
                  setUrlMode(false)
                  setError(null)
                }}
                className="text-text3 hover:text-text"
              >
                <X className="size-4" />
              </button>
            </div>
            <input
              ref={urlInputRef}
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="https://yourrestaurant.com/menu"
              className="border-brand-border text-text placeholder:text-text3 w-full rounded-xl border bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-offset-1 focus:outline-none"
              autoFocus
            />
            <p className="text-text3 text-xs">
              We'll scrape the page and extract all menu items automatically.
            </p>
            <Button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!urlValue.trim()}
              className="bg-g800 hover:bg-g800/90 self-end text-white"
            >
              Extract from URL
            </Button>
          </div>
        ) : pasteMode ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-text text-sm font-semibold">Paste your menu text</p>
              <button
                type="button"
                onClick={() => {
                  setPasteMode(false)
                  setError(null)
                }}
                className="text-text3 hover:text-text"
              >
                <X className="size-4" />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={
                'Burrata di Puglia — Creamy burrata, heirloom tomatoes — €16\nTagliatelle al Tartufo — Fresh pasta, black truffle — €32\n…'
              }
              rows={8}
              className="border-brand-border text-text placeholder:text-text3 w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-offset-1 focus:outline-none"
              autoFocus
            />
            <Button
              type="button"
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
              className="bg-g800 hover:bg-g800/90 self-end text-white"
            >
              Extract items
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-g50 ring-g100 flex h-14 w-14 items-center justify-center rounded-2xl ring-1">
              <Camera className="text-g800 size-6 md:hidden" aria-hidden="true" />
              <Cloud className="text-g800 hidden size-6 md:block" aria-hidden="true" />
            </div>

            <p className="font-display text-text mt-4 text-base font-semibold md:hidden">
              {t('mobileDrop')}
            </p>
            <p className="text-text2 mt-1 text-xs md:hidden">{t('mobileBrowse')}</p>

            <p className="font-display text-text mt-4 hidden text-base font-semibold md:block">
              {t('drop')}
            </p>
            <p className="text-text2 mt-1 hidden text-xs md:block">{t('browse')}</p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {ALT_PILLS.map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (key === 'paste') {
                      setUrlMode(false)
                      setPasteMode(true)
                    }
                    if (key === 'url') {
                      setPasteMode(false)
                      setUrlMode(true)
                    }
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

      {error && (
        <p role="alert" className="text-pill-red-fg mt-3 text-sm">
          {error}
        </p>
      )}

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
