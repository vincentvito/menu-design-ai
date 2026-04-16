'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { SocialPost } from '@/lib/mock-data'

export type SocialFilter = 'all' | SocialPost['platform']

const ORDER: SocialFilter[] = ['all', 'instagram', 'story']

export function SocialFilterPills({
  value,
  onChange,
}: {
  value: SocialFilter
  onChange: (v: SocialFilter) => void
}) {
  const t = useTranslations('Social.filters')

  return (
    <div className="flex flex-wrap gap-2">
      {ORDER.map((key) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={cn(
              'inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-g800 text-white'
                : 'bg-card border-brand-border text-text2 hover:text-text border',
            )}
          >
            {t(key)}
          </button>
        )
      })}
    </div>
  )
}
