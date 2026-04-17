import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type TierKey = 'digital' | 'physical' | 'both'

const tiers: { key: TierKey; price: string; featured?: boolean }[] = [
  { key: 'digital', price: '6.99' },
  { key: 'physical', price: '17.99', featured: true },
  { key: 'both', price: '19.99' },
]

export async function PricingCards() {
  const t = await getTranslations('Landing.pricing')

  return (
    <section id="pricing" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-amber text-xs font-semibold tracking-[0.2em] uppercase">
            {t('label')}
          </p>
          <h2
            className="font-display text-text mt-3 text-3xl font-bold sm:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            {t('title')}
          </h2>
          <p className="text-text2 mt-4 text-base sm:text-lg">{t('description')}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          {tiers.map((tier) => {
            const featured = tier.featured
            return (
              <div
                key={tier.key}
                className={cn(
                  'relative flex flex-col rounded-2xl p-8 shadow-sm transition-shadow hover:shadow-lg',
                  featured
                    ? 'bg-g800 ring-amber/40 text-white ring-2'
                    : 'border-brand-border border bg-white',
                )}
              >
                {featured && (
                  <div className="bg-amber text-pill-amber-fg absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold">
                    <Star className="h-3 w-3" />
                    {t('badge')}
                  </div>
                )}

                <h3
                  className={cn(
                    'font-display text-xl font-bold',
                    featured ? 'text-white' : 'text-text',
                  )}
                >
                  {t(`tiers.${tier.key}.name`)}
                </h3>
                <p className={cn('mt-1 text-sm', featured ? 'text-g200' : 'text-text2')}>
                  {t(`tiers.${tier.key}.tagline`)}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span
                    className={cn(
                      'font-display text-5xl font-bold',
                      featured ? 'text-white' : 'text-text',
                    )}
                  >
                    ${tier.price}
                  </span>
                  <span className={cn('text-sm', featured ? 'text-g200' : 'text-text3')}>
                    {t('perMonth')}
                  </span>
                </div>

                <ul className="mt-8 space-y-3">
                  {(['feature1', 'feature2', 'feature3'] as const).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          featured ? 'text-amber' : 'text-g600',
                        )}
                      />
                      <span className={featured ? 'text-g100' : 'text-text2'}>
                        {t(`tiers.${tier.key}.${f}`)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  className={cn(
                    'mt-8 w-full',
                    featured
                      ? 'bg-amber text-pill-amber-fg hover:bg-amber/90'
                      : 'bg-g800 hover:bg-g700 text-white',
                  )}
                >
                  <Link href="/dashboard/menus/new">{t('cta')}</Link>
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
