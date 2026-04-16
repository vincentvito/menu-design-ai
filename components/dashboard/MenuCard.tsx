import { memo } from 'react'
import Link from 'next/link'
import { MoveRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MenuThumb } from '@/components/menus/MenuThumb'
import { StatusPill } from './StatusPill'
import { timeAgo } from '@/lib/format'
import type { Menu } from '@/lib/mock-data'

interface MenuCardProps {
  menu: Menu
  href?: string
}

export const MenuCard = memo(function MenuCard({ menu, href }: MenuCardProps) {
  const link = href ?? `/dashboard/menus/${menu.id}`

  return (
    <Link href={link} className="group block">
      <Card className="border-brand-border bg-card overflow-hidden transition-all group-hover:shadow-md">
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
              {menu.style} · {menu.itemCount} items · Updated {timeAgo(menu.updatedAt)}
            </p>
          </div>
          <MoveRight
            aria-hidden="true"
            className="text-text3 size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-current"
          />
        </div>
      </Card>
    </Link>
  )
})
