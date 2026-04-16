import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MenuEmptyState() {
  const t = useTranslations('Menus.empty')

  return (
    <div className="border-brand-border bg-card flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
      <div className="bg-amber-l text-pill-amber-fg ring-amber/20 flex h-12 w-12 items-center justify-center rounded-2xl ring-1">
        <Sparkles className="size-5" />
      </div>
      <h2 className="font-display text-text mt-5 text-xl font-bold">{t('title')}</h2>
      <p className="text-text2 mt-2 max-w-sm text-sm leading-relaxed">{t('description')}</p>
      <Button asChild size="lg" className="bg-amber text-pill-amber-fg hover:bg-amber/90 mt-6">
        <Link href="/dashboard/menus/new">
          {t('cta')}
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  )
}
