'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { MenuGridCard } from '@/components/menus/MenuGridCard'
import { MenuEmptyState } from '@/components/menus/MenuEmptyState'
import { MenuFilterPills, type MenuFilter } from '@/components/menus/MenuFilterPills'
import { TopBar } from '@/components/layout/TopBar'
import type { MenuSummary } from '@/lib/menus/list'

interface MenusViewProps {
  menus: MenuSummary[]
}

export function MenusView({ menus }: MenusViewProps) {
  const t = useTranslations('Menus')
  const locale = useLocale()
  const [filter, setFilter] = useState<MenuFilter>('all')

  const counts = useMemo(() => {
    const base: Record<MenuFilter, number> = {
      all: menus.length,
      active: 0,
      'print-ready': 0,
      draft: 0,
    }
    menus.forEach((m) => (base[m.status] += 1))
    return base
  }, [menus])

  const filtered = useMemo(
    () => (filter === 'all' ? menus : menus.filter((m) => m.status === filter)),
    [filter, menus],
  )

  return (
    <>
      <TopBar
        title={t('title')}
        subtitle={t('subtitle')}
        locale={locale}
        primaryAction={{ href: '/dashboard/menus/new', label: t('new') }}
      />

      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        {menus.length === 0 ? (
          <MenuEmptyState />
        ) : (
          <>
            <div className="mb-6">
              <MenuFilterPills value={filter} onChange={setFilter} counts={counts} />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((menu) => (
                <MenuGridCard key={menu.id} menu={menu} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
