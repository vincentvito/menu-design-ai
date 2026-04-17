import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MenuPreviewCard } from './MenuPreviewCard'

export async function Hero() {
  const t = await getTranslations('Landing.hero')

  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Left */}
          <div className="text-center lg:text-left">
            <div className="animate-fade-up bg-amber-l text-pill-amber-fg ring-amber/20 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold ring-1">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('eyebrow')}
            </div>

            <h1
              className="animate-fade-up font-display text-text mt-6 font-bold"
              style={{
                fontSize: 'clamp(2.5rem, 4.5vw + 1rem, 4.75rem)',
                lineHeight: 1.05,
                textWrap: 'balance',
                animationDelay: '80ms',
              }}
            >
              {t('title')} <span className="text-amber italic">{t('titleHighlight')}</span>
            </h1>

            <p
              className="animate-fade-up text-text2 mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg lg:mx-0"
              style={{ animationDelay: '160ms' }}
            >
              {t('description')}
            </p>

            <div
              className="animate-fade-up mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
              style={{ animationDelay: '240ms' }}
            >
              <Button
                asChild
                size="lg"
                className="bg-amber text-pill-amber-fg hover:bg-amber/90 w-full shadow-md sm:w-auto"
              >
                <Link href="/dashboard/menus/new">
                  {t('ctaPrimary')}
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-brand-border w-full bg-white sm:w-auto"
              >
                <a href="#samples">{t('ctaSecondary')}</a>
              </Button>
            </div>

            <p
              className="animate-fade-up text-text3 mt-6 text-xs"
              style={{ animationDelay: '320ms' }}
            >
              {t('proof')}
            </p>
          </div>

          {/* Right */}
          <div
            className="animate-fade-up relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
            style={{ animationDelay: '200ms' }}
          >
            <MenuPreviewCard />
          </div>
        </div>
      </div>
    </section>
  )
}
