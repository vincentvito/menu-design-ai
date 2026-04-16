'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MenuThumb } from '@/components/menus/MenuThumb'
import { StatusPill } from '@/components/dashboard/StatusPill'
import { timeAgo } from '@/lib/format'
import type { Menu } from '@/lib/mock-data'

interface MenuGridCardProps {
  menu: Menu
}

export const MenuGridCard = memo(function MenuGridCard({ menu }: MenuGridCardProps) {
  const t = useTranslations('Menus.card')
  const href = `/dashboard/menus/${menu.id}`

  return (
    <Card className="border-brand-border bg-card overflow-hidden p-0 transition-all hover:shadow-md">
      <div className="relative">
        <MenuThumb menu={menu} />
        <div className="absolute top-3 left-3">
          <StatusPill status={menu.status} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="font-display text-text truncate text-sm font-semibold">{menu.name}</h3>
          <p className="text-text2 mt-0.5 text-xs">
            {menu.style} · {t('itemCount', { count: menu.itemCount })}
          </p>
          <p className="text-text2 mt-0.5 text-[11px]">Updated {timeAgo(menu.updatedAt)}</p>
        </div>
        <Button asChild variant="outline" className="border-brand-border">
          <Link href={href} aria-label={`${t('edit')} ${menu.name}`}>
            <Pencil className="size-4" aria-hidden="true" />
            <span>{t('edit')}</span>
          </Link>
        </Button>
      </div>
    </Card>
  )
})
