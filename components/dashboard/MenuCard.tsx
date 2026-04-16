import { memo } from 'react'
import Link from 'next/link'
import { MoveRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MenuThumb } from '@/components/menus/MenuThumb'
import { StatusPill } from './StatusPill'
import { timeAgo } from '@/lib/format'
import type { MenuSummary } from '@/lib/menus/list'

interface MenuCardProps {
  menu: MenuSummary
  href?: string
}

export const MenuCard = memo(function MenuCard({ menu, href }: MenuCardProps) {
  const link = href ?? `/dashboard/menus/${menu.id}`

  return (
    <Link href={link} className="group block">
      <Card className="border-brand-border bg-card flex flex-row items-center gap-3 overflow-hidden p-3 transition-all group-hover:shadow-md">
        <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-md">
          {menu.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={menu.thumbUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <MenuThumb menu={menu} size="sm" className="h-full w-full" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-text truncate text-sm font-semibold">{menu.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusPill status={menu.status} />
            <span className="text-text2 truncate text-xs">
              {menu.style} · {menu.itemCount} items · {timeAgo(menu.updatedAt)}
            </span>
          </div>
        </div>
        <MoveRight
          aria-hidden="true"
          className="text-text3 size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-current"
        />
      </Card>
    </Link>
  )
})
