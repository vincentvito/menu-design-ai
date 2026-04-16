'use client'

import { useTranslations } from 'next-intl'
import { FileText, QrCode, Share2, Stamp, Truck, Languages, Check } from 'lucide-react'
import { WizardStep } from '@/components/wizard/WizardShell'
import { cn } from '@/lib/utils'
import { EXPORT_KEYS, type ExportKey, type WizardState } from '../useWizard'

interface Props {
  state: WizardState
  dispatch: React.Dispatch<any>
}

const ICONS: Record<ExportKey, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  qr: QrCode,
  social: Share2,
  kit: Stamp,
  fulfillment: Truck,
  translations: Languages,
}

const INCLUDED: ReadonlySet<ExportKey> = new Set<ExportKey>(['pdf', 'qr'])

export function Step5Export({ state, dispatch }: Props) {
  const t = useTranslations('Wizard.export')

  return (
    <WizardStep stepKey="export" title={t('title')} description={t('description')}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_KEYS.map((key) => {
          const Icon = ICONS[key]
          const selected = state.exports.has(key)
          const included = INCLUDED.has(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => dispatch({ type: 'toggle-export', key })}
              aria-pressed={selected}
              className={cn(
                'group border-brand-border bg-card relative flex flex-col items-start rounded-2xl border p-5 text-left transition-all hover:shadow-md',
                selected && 'ring-g800 border-g800 bg-g50 ring-2',
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  included
                    ? 'bg-pill-green-bg text-pill-green-fg'
                    : 'bg-amber-l text-pill-amber-fg',
                )}
              >
                <Icon className="size-4" />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <h4 className="font-display text-text text-sm font-semibold">
                  {t(`options.${key}.name`)}
                </h4>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    included
                      ? 'bg-pill-green-bg text-pill-green-fg'
                      : 'bg-pill-amber-bg text-pill-amber-fg',
                  )}
                >
                  {included ? t('included') : t('addOn')}
                </span>
              </div>

              <p className="text-text2 mt-1.5 text-xs leading-relaxed">
                {t(`options.${key}.description`)}
              </p>

              <span
                className={cn(
                  'mt-4 inline-flex items-center gap-1 text-xs font-semibold',
                  selected ? 'text-g800' : 'text-text3',
                )}
              >
                {selected ? (
                  <>
                    <Check className="size-3" />
                    {t('selected')}
                  </>
                ) : (
                  t('select')
                )}
              </span>
            </button>
          )
        })}
      </div>
    </WizardStep>
  )
}
