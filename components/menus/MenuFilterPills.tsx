'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { Menu } from '@/lib/mock-data'

export type MenuFilter = 'all' | Menu['status']

interface MenuFilterPillsProps {
  value: MenuFilter
  onChange: (value: MenuFilter) => void
  counts: Record<MenuFilter, number>
}

const ORDER: MenuFilter[] = ['all', 'active', 'print-ready', 'draft']

const KEY_MAP: Record<MenuFilter, string> = {
  all: 'all',
  active: 'active',
  'print-ready': 'printReady',
  draft: 'draft',
}

export function MenuFilterPills({ value, onChange, counts }: MenuFilterPillsProps) {
  const t = useTranslations('Menus.filters')

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
              'inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-g800 text-white'
                : 'bg-card border-brand-border text-text2 hover:text-text border',
            )}
          >
            {t(KEY_MAP[key])}
            <span
              className={cn(
                'rounded-full px-1.5 text-[10px] font-semibold',
                active ? 'bg-white/20 text-white' : 'bg-g50 text-text3',
              )}
            >
              {counts[key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
