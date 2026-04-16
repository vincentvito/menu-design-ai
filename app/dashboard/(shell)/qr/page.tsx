'use client'

import { useLocale, useTranslations } from 'next-intl'
import { TopBar } from '@/components/layout/TopBar'
import { QRCard } from '@/components/qr/QRCard'
import { AddLocationCard } from '@/components/qr/AddLocationCard'
import { ScanAnalytics } from '@/components/qr/ScanAnalytics'
import { SAMPLE_QR_LOCATIONS } from '@/lib/mock-data'

export default function QRPage() {
  const t = useTranslations('QR')
  const locale = useLocale()

  return (
    <>
      <TopBar title={t('title')} subtitle={t('subtitle')} locale={locale} />

      <div className="mx-auto w-full max-w-7xl space-y-10 px-5 py-8 sm:px-8">
        <section>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_QR_LOCATIONS.map((loc) => (
              <QRCard key={loc.id} location={loc} />
            ))}
            <AddLocationCard />
          </div>
        </section>

        <section>
          <ScanAnalytics />
        </section>
      </div>
    </>
  )
}
