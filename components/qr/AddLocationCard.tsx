import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Plus, Crown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function AddLocationCard() {
  const t = useTranslations('QR')

  return (
    <Card className="border-amber/30 bg-amber-l flex flex-col items-center justify-center gap-3 border-dashed p-6 text-center">
      <div className="bg-amber text-pill-amber-fg flex h-12 w-12 items-center justify-center rounded-2xl">
        <Plus className="size-5" aria-hidden="true" />
      </div>
      <h3 className="font-display text-text text-sm font-semibold">{t('addLocation')}</h3>
      <p className="text-text2 max-w-[14rem] text-xs leading-relaxed">{t('addLocationTagline')}</p>
      <Button asChild size="sm" className="bg-pill-amber-fg hover:bg-pill-amber-fg/90 text-white">
        <Link href="/dashboard/billing">
          <Crown className="size-3" aria-hidden="true" />
          {t('upgrade')}
        </Link>
      </Button>
    </Card>
  )
}
