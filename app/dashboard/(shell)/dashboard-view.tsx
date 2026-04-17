'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { QrCode, Flame, BookOpenCheck, Share2, Sprout, Camera, Brush } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { StatCard } from '@/components/dashboard/StatCard'
import { MenuCard } from '@/components/dashboard/MenuCard'
import { QuickActionCard } from '@/components/dashboard/QuickActionCard'
import { ItemAnalyticsTable } from '@/components/dashboard/ItemAnalyticsTable'
import { MenuEmptyState } from '@/components/menus/MenuEmptyState'
import { SAMPLE_MENU_ITEMS } from '@/lib/mock-data'
import { greetingKey, formatNumber } from '@/lib/format'
import type { MenuSummary } from '@/lib/menus/list'

interface SessionUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface DashboardViewProps {
  user: SessionUser
  menus: MenuSummary[]
}

export function DashboardView({ user, menus }: DashboardViewProps) {
  const t = useTranslations('Dashboard')
  const locale = useLocale()

  const greeting = useMemo(() => {
    const firstName = (user.name || user.email || 'there').split(' ')[0].split('@')[0]
    return t(greetingKey(), { name: firstName })
  }, [user.name, user.email, t])

  const primaryAction = useMemo(() => ({ href: '/dashboard/menus/new', label: t('newMenu') }), [t])
  const secondaryAction = useMemo(() => ({ href: '/dashboard/qr', label: t('viewQr') }), [t])

  return (
    <>
      <TopBar
        title={greeting}
        subtitle={t('subtitle')}
        locale={locale}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />

      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        {/* Only the real-data stat is surfaced right now. The QR / top-item / posts
            cards are still placeholder and stay hidden until wired to real metrics. */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('stats.menusGenerated')}
            value={String(menus.length)}
            hint={t('stats.creditsLeft', { count: 1 })}
            accent="blue"
            icon={<BookOpenCheck className="size-4" />}
          />
          <StatCard
            label={t('stats.scans')}
            value={formatNumber(1284)}
            trend={23}
            accent="green"
            icon={<QrCode className="size-4" />}
            className="hidden"
          />
          <StatCard
            label={t('stats.topItem')}
            value="Tagliatelle al Tartufo"
            hint={`${formatNumber(340)} views`}
            accent="amber"
            icon={<Flame className="size-4" />}
            className="hidden"
          />
          <StatCard
            label={t('stats.posts')}
            value="8"
            hint={t('stats.scheduled', { days: 14 })}
            accent="neutral"
            icon={<Share2 className="size-4" />}
            className="hidden"
          />
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-text text-lg font-semibold">{t('recentMenus')}</h2>
            </div>
            {menus.length === 0 ? (
              <MenuEmptyState />
            ) : (
              <div className="flex flex-col gap-3">
                {menus.map((m) => (
                  <MenuCard key={m.id} menu={m} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-text text-lg font-semibold">{t('quickActions')}</h2>
            </div>
            <div className="space-y-3">
              <QuickActionCard
                icon={<Sprout className="size-5" />}
                title={t('actions.seasonal.title')}
                description={t('actions.seasonal.description')}
                href="/dashboard/menus/new"
                variant="green"
              />
              <QuickActionCard
                icon={<Camera className="size-5" />}
                title={t('actions.photos.title')}
                description={t('actions.photos.description')}
                cta={t('actions.photos.cta')}
                variant="amber"
              />
              <QuickActionCard
                icon={<Brush className="size-5" />}
                title={t('actions.designer.title')}
                description={t('actions.designer.description')}
                cta={t('actions.designer.cta')}
              />
            </div>
          </div>
        </section>

        <section className="mt-10 hidden">
          <ItemAnalyticsTable items={SAMPLE_MENU_ITEMS} limit={6} />
        </section>
      </div>
    </>
  )
}
