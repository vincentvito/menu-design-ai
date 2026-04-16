import { getTranslations } from 'next-intl/server'
import { Upload, Palette, Download } from 'lucide-react'

export async function HowItWorks() {
  const t = await getTranslations('Landing.how')

  const steps = [
    { key: 'upload', Icon: Upload },
    { key: 'style', Icon: Palette },
    { key: 'ship', Icon: Download },
  ] as const

  return (
    <section id="how" className="relative py-24 sm:py-28">
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
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.key}
              className="border-brand-border group relative rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-md"
            >
              <div className="bg-g50 text-g800 ring-g100 flex h-12 w-12 items-center justify-center rounded-xl ring-1">
                <step.Icon className="h-5 w-5" />
              </div>

              <div className="text-g200 font-display absolute top-6 right-6 text-5xl font-bold">
                0{i + 1}
              </div>

              <h3 className="font-display text-text mt-6 text-xl font-bold">
                {t(`steps.${step.key}.title`)}
              </h3>
              <p className="text-text2 mt-3 text-sm leading-relaxed">
                {t(`steps.${step.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
