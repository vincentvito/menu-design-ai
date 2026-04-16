'use client'

import { useTranslations } from 'next-intl'
import { Sparkles, Languages, Camera, Wand2, Star, Leaf, Check } from 'lucide-react'
import { WizardStep } from '@/components/wizard/WizardShell'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WizardState } from '../useWizard'

interface Props {
  state: WizardState
  dispatch: React.Dispatch<any>
}

export function Step3Enrichment({ state, dispatch }: Props) {
  const t = useTranslations('Wizard.enrich')

  const toggles = [
    {
      key: 'autoDescriptions',
      Icon: Wand2,
      title: t('toggles.descriptions.title'),
      desc: t('toggles.descriptions.description'),
    },
    {
      key: 'dietaryDetection',
      Icon: Leaf,
      title: t('toggles.dietary.title'),
      desc: t('toggles.dietary.description'),
    },
    {
      key: 'chefsPick',
      Icon: Star,
      title: t('toggles.chef.title'),
      desc: t('toggles.chef.description'),
    },
  ] as const

  const addOns = [
    {
      key: 'addOnLanguage',
      Icon: Languages,
      title: t('addOns.language.title'),
      desc: t('addOns.language.description'),
      price: t('addOns.language.price'),
    },
    {
      key: 'addOnPhotos',
      Icon: Camera,
      title: t('addOns.photos.title'),
      desc: t('addOns.photos.description'),
      price: t('addOns.photos.price'),
    },
  ] as const

  return (
    <WizardStep stepKey="enrich" title={t('title')} description={t('description')}>
      <div className="border-brand-border bg-card divide-brand-border divide-y rounded-2xl border">
        {toggles.map(({ key, Icon, title, desc }) => {
          const checked = state[key] as boolean
          return (
            <div key={key} className="flex items-start gap-4 p-5">
              <div className="bg-g50 text-g800 ring-g100 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <Label htmlFor={key} className="font-display text-text text-sm font-semibold">
                  {title}
                </Label>
                <p className="text-text2 mt-1 text-xs leading-relaxed">{desc}</p>
              </div>
              <Switch
                id={key}
                checked={checked}
                onCheckedChange={(v) => dispatch({ type: 'set', patch: { [key]: v } })}
              />
            </div>
          )
        })}
      </div>

      <h2 className="font-display text-text mt-10 mb-4 inline-flex items-center gap-2 text-base font-semibold">
        <Sparkles className="size-4" />
        {t('addOnsTitle')}
      </h2>

      <div className="space-y-3">
        {addOns.map(({ key, Icon, title, desc, price }) => {
          const added = state[key] as boolean
          return (
            <div
              key={key}
              className={cn(
                'border-brand-border bg-amber-l/40 relative flex items-start gap-4 rounded-2xl border p-5',
                added && 'border-amber/40 bg-amber-l',
              )}
            >
              <div className="bg-amber text-pill-amber-fg ring-amber/30 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-display text-text text-sm font-semibold">{title}</p>
                  <span className="text-pill-amber-fg rounded-full bg-white/60 px-2 py-0.5 font-mono text-[10px] font-medium">
                    {price}
                  </span>
                </div>
                <p className="text-text2 mt-1 text-xs leading-relaxed">{desc}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={added ? 'default' : 'outline'}
                onClick={() => dispatch({ type: 'set', patch: { [key]: !added } })}
                className={cn(
                  added && 'bg-amber text-pill-amber-fg hover:bg-amber/90',
                  !added && 'border-amber/40 text-pill-amber-fg hover:bg-amber-l',
                )}
              >
                {added ? (
                  <>
                    <Check className="size-3" />
                    {t('added')}
                  </>
                ) : (
                  t('add')
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </WizardStep>
  )
}
