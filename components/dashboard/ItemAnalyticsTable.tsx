import { memo, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import type { MenuItem } from '@/lib/mock-data'

interface ItemAnalyticsTableProps {
  items: MenuItem[]
  limit?: number
}

export const ItemAnalyticsTable = memo(function ItemAnalyticsTable({
  items,
  limit = 6,
}: ItemAnalyticsTableProps) {
  const t = useTranslations('Dashboard.analytics')
  const rows = useMemo(() => items.slice(0, limit), [items, limit])

  return (
    <Card className="border-brand-border bg-card overflow-hidden p-0">
      <div className="border-brand-border flex items-center justify-between border-b px-5 py-4">
        <h3 className="font-display text-text text-sm font-semibold">{t('title')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-g50 text-text2">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-semibold tracking-wider uppercase">
                {t('item')}
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold tracking-wider uppercase">
                {t('category')}
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold tracking-wider uppercase">
                {t('views')}
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold tracking-wider uppercase">
                {t('trend')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-brand-border divide-y">
            {rows.map((item) => {
              const trend = item.trend ?? 0
              const up = trend >= 0
              const TrendIcon = up ? TrendingUp : TrendingDown
              return (
                <tr key={item.id} className="hover:bg-g50/60 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-display text-text text-sm font-semibold">{item.name}</p>
                  </td>
                  <td className="text-text2 px-5 py-3 text-xs">{item.category}</td>
                  <td className="text-text px-5 py-3 text-right font-mono text-xs">
                    {formatNumber(item.views ?? 0)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 text-xs font-semibold',
                        up ? 'text-pill-green-fg' : 'text-destructive',
                      )}
                    >
                      <TrendIcon className="size-3" />
                      {Math.abs(trend)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
})
