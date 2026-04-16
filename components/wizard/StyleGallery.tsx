'use client'

import { useTranslations } from 'next-intl'
import { Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
export const STYLE_KEYS = [
  'typography',
  'minimal',
  'vintage',
  'editorial',
  'accented',
  'full',
] as const
export type StyleKey = (typeof STYLE_KEYS)[number]

interface StyleGalleryProps {
  value: StyleKey | null
  onChange: (key: StyleKey) => void
  missingPhotos: number
}

const PHOTO_INTENSITY: Record<StyleKey, number> = {
  typography: 0,
  minimal: 1,
  vintage: 1,
  editorial: 2,
  accented: 3,
  full: 4,
}

function MiniPreview({ style }: { style: StyleKey }) {
  switch (style) {
    case 'typography':
      return (
        <div className="bg-g800 flex h-full flex-col justify-center p-3">
          <p className="font-display text-center text-sm font-bold text-white italic">Menu</p>
          <div className="bg-amber mx-auto mt-2 h-[1px] w-6" />
          <p className="text-g200 mt-2 text-center text-[7px]">Tagliatelle · €32</p>
        </div>
      )
    case 'minimal':
      return (
        <div className="flex h-full flex-col justify-between bg-white p-3">
          <div className="bg-text h-[1px] w-3" />
          <p className="text-text font-display text-right text-xs font-light italic">À la carte</p>
        </div>
      )
    case 'vintage':
      return (
        <div
          className="flex h-full flex-col items-center justify-center p-3"
          style={{
            background:
              'repeating-linear-gradient(45deg, var(--color-cream), var(--color-cream) 4px, color-mix(in oklab, var(--color-amber-l) 65%, var(--color-cream)) 4px, color-mix(in oklab, var(--color-amber-l) 65%, var(--color-cream)) 5px)',
          }}
        >
          <p className="text-pill-amber-fg text-[7px] tracking-[0.3em]">EST 1902</p>
          <p className="text-text font-display mt-1 text-xs font-bold italic">Trattoria</p>
        </div>
      )
    case 'editorial':
      return (
        <div className="grid h-full grid-cols-2 gap-1 bg-white p-2">
          <div className="bg-g50" />
          <div className="flex flex-col justify-center">
            <div className="bg-text/30 mb-1 h-[1px]" />
            <div className="bg-text/30 mb-1 h-[1px]" />
            <div className="bg-text/30 h-[1px] w-2/3" />
          </div>
        </div>
      )
    case 'accented':
      return (
        <div className="flex h-full flex-col bg-white">
          <div
            className="h-1/2"
            style={{
              background: 'linear-gradient(135deg, var(--color-amber), var(--color-pill-amber-fg))',
            }}
          />
          <div className="flex flex-1 items-center justify-center">
            <p className="text-text font-display text-[9px] font-semibold">Signature</p>
          </div>
        </div>
      )
    case 'full':
      return (
        <div className="grid h-full grid-cols-2 gap-px bg-white">
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-amber), var(--color-pill-amber-fg))',
            }}
          />
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-g600), var(--color-g800))',
            }}
          />
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-g200), var(--color-g600))',
            }}
          />
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-amber-l), var(--color-amber))',
            }}
          />
        </div>
      )
  }
}

export function StyleGallery({ value, onChange, missingPhotos }: StyleGalleryProps) {
  const t = useTranslations('Wizard.style')

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-6">
        {STYLE_KEYS.map((key) => {
          const active = value === key
          const intensity = PHOTO_INTENSITY[key]
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={active}
              className={cn(
                'group border-brand-border bg-card relative flex flex-col overflow-hidden rounded-xl border p-0 text-left transition-all hover:shadow-md',
                active && 'ring-g800 border-g800 ring-2',
              )}
            >
              <div className="aspect-[5/4] overflow-hidden">
                <MiniPreview style={key} />
              </div>

              <div className="px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-display text-text text-sm font-semibold">
                    {t(`gallery.${key}.name`)}
                  </h4>
                  {active && (
                    <span className="bg-pill-green-bg text-pill-green-fg inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <p className="text-text3 mt-0.5 text-xs">{t(`gallery.${key}.tagline`)}</p>

                {/* Photo intensity bar */}
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-text3 text-[10px] tracking-wide uppercase">Photos</span>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          'h-1 w-3 rounded-full',
                          i < intensity ? 'bg-amber' : 'bg-g100',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {value === 'full' && missingPhotos > 0 && (
        <div className="border-amber/30 bg-amber-l text-pill-amber-fg mt-4 flex items-start gap-3 rounded-lg border p-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="text-xs leading-relaxed">{t('photoNudge', { missing: missingPhotos })}</p>
        </div>
      )}
    </div>
  )
}
