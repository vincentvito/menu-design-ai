import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Download } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QRPattern } from '@/components/qr/QRPattern'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import type { QrLocation } from '@/lib/mock-data'

interface QRCardProps {
  location: QrLocation
}

export const QRCard = memo(function QRCard({ location }: QRCardProps) {
  const t = useTranslations('QR')
  const active = location.status === 'active'

  return (
    <Card className="border-brand-border bg-card overflow-hidden p-0 transition-shadow hover:shadow-md">
      <div className="bg-g50 relative flex items-center justify-center p-6">
        <span
          className="bg-amber-l text-pill-amber-fg ring-amber/30 absolute top-3 right-3 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1"
          aria-hidden="true"
        >
          {t('previewBadge')}
        </span>
        <div className="border-brand-border flex h-40 w-40 items-center justify-center rounded-2xl border bg-white p-3 shadow-sm">
          <QRPattern seed={location.slug} label={t('previewLabel', { name: location.name })} />
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-text text-sm font-semibold">{location.name}</h3>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
              active ? 'bg-pill-green-bg text-pill-green-fg' : 'bg-pill-gray-bg text-pill-gray-fg',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                active ? 'bg-pill-green-fg' : 'bg-pill-gray-fg opacity-50',
              )}
            />
            {t(`status.${location.status}`)}
          </span>
        </div>

        <p className="text-text2 truncate font-mono text-xs">menuai.app/{location.slug}</p>

        <div className="border-brand-border flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <span className="text-text2 text-sm">
            {t('scans', { count: formatNumber(location.scans) })}
          </span>
          <Button variant="outline" className="border-brand-border">
            <Download className="size-4" aria-hidden="true" />
            {t('download')}
          </Button>
        </div>
      </div>
    </Card>
  )
})
