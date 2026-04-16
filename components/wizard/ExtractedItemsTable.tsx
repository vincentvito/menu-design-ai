'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { SAMPLE_CATEGORIES, type CategoryFilter, type MenuItem } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/format'

interface ExtractedItemsTableProps {
  items: MenuItem[]
}

export function ExtractedItemsTable({ items }: ExtractedItemsTableProps) {
  const t = useTranslations('Wizard.upload')
  const [filter, setFilter] = useState<CategoryFilter>('All')

  const rows = useMemo(
    () => (filter === 'All' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  )

  return (
    <div className="border-brand-border bg-card overflow-hidden rounded-2xl border">
      {/* Filter pills */}
      <div
        className="border-brand-border flex flex-wrap gap-2 border-b px-5 py-3"
        role="tablist"
        aria-label="Category filter"
      >
        {SAMPLE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={cat === filter}
            onClick={() => setFilter(cat)}
            className={cn(
              'min-h-[36px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              cat === filter
                ? 'bg-g800 text-white'
                : 'bg-g50 text-text2 hover:bg-g100 hover:text-g800',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-g50 text-text2 text-left">
            <tr>
              <th
                scope="col"
                className="px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
              >
                {t('table.item')}
              </th>
              <th
                scope="col"
                className="px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
              >
                {t('table.category')}
              </th>
              <th
                scope="col"
                className="px-5 py-2.5 text-right text-xs font-semibold tracking-wider uppercase"
              >
                {t('table.price')}
              </th>
              <th
                scope="col"
                className="px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
              >
                {t('table.description')}
              </th>
              <th
                scope="col"
                className="px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
              >
                {t('table.tags')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-brand-border divide-y">
            {rows.map((item) => (
              <tr key={item.id} className="hover:bg-g50/60 transition-colors">
                <th scope="row" className="px-5 py-3 text-left">
                  <span className="font-display text-text text-sm font-semibold">{item.name}</span>
                </th>
                <td className="text-text2 px-5 py-3 text-xs">{item.category}</td>
                <td className="text-text px-5 py-3 text-right font-mono text-xs whitespace-nowrap">
                  {formatPrice(item.price)}
                </td>
                <td className="text-text2 max-w-xs px-5 py-3 text-xs">
                  <span className="line-clamp-2">{item.description}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-pill-green-bg text-pill-green-fg h-5 border-0 px-1.5 text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-brand-border flex items-center border-t px-5 py-3">
        <p className="text-text2 text-xs">{t('extracted', { count: rows.length })}</p>
      </div>
    </div>
  )
}

export function DietaryLegend() {
  const t = useTranslations('Wizard.upload.legend')
  const tags = ['V', 'VG', 'GF', 'DF', 'NF'] as const

  return (
    <div className="border-brand-border bg-g50/50 mt-4 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3">
      <span className="text-text2 text-xs font-semibold">{t('title')}</span>
      {tags.map((tag) => (
        <span key={tag} className="text-text3 inline-flex items-center gap-1.5 text-xs">
          <Badge
            variant="secondary"
            className="bg-pill-green-bg text-pill-green-fg h-5 border-0 px-1.5 text-[10px]"
          >
            {tag}
          </Badge>
          {t(tag)}
        </span>
      ))}
    </div>
  )
}
