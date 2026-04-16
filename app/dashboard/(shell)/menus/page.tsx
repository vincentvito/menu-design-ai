'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { MenuGridCard } from '@/components/menus/MenuGridCard'
import { MenuEmptyState } from '@/components/menus/MenuEmptyState'
import { MenuFilterPills, type MenuFilter } from '@/components/menus/MenuFilterPills'
import { TopBar } from '@/components/layout/TopBar'
import { SAMPLE_MENUS } from '@/lib/mock-data'

export default function MyMenusPage() {
  const t = useTranslations('Menus')
  const locale = useLocale()
  const [filter, setFilter] = useState<MenuFilter>('all')

  const counts = useMemo(() => {
    const base: Record<MenuFilter, number> = {
      all: SAMPLE_MENUS.length,
      active: 0,
      'print-ready': 0,
      draft: 0,
    }
    SAMPLE_MENUS.forEach((m) => (base[m.status] += 1))
    return base
  }, [])

  const menus = useMemo(
    () => (filter === 'all' ? SAMPLE_MENUS : SAMPLE_MENUS.filter((m) => m.status === filter)),
    [filter],
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
        {SAMPLE_MENUS.length === 0 ? (
          <MenuEmptyState />
        ) : (
          <>
            <div className="mb-6">
              <MenuFilterPills value={filter} onChange={setFilter} counts={counts} />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {menus.map((menu) => (
                <MenuGridCard key={menu.id} menu={menu} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
