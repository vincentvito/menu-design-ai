import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'

export async function CTABanner() {
  const t = await getTranslations('Landing.cta')

  return (
    <section className="relative px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="bg-g800 rounded-3xl px-8 py-16 text-center shadow-xl sm:px-16 sm:py-20">
          <h2
            className="font-display mx-auto max-w-2xl text-3xl font-bold text-white sm:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            {t('title')}
          </h2>
          <p className="text-g200 mx-auto mt-5 max-w-lg text-base sm:text-lg">{t('description')}</p>

          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="bg-amber text-pill-amber-fg hover:bg-amber/90 shadow-lg"
            >
              <Link href="/auth/login">{t('button')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
