import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { Menu } from '@/lib/mock-data'

interface MenuThumbProps {
  menu: Pick<Menu, 'name' | 'colorScheme'>
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Mini mock menu preview rendered purely in CSS — no images required.
 * Shape/style varies by the menu's colorScheme so each card feels distinct.
 */
export const MenuThumb = memo(function MenuThumb({ menu, className, size = 'md' }: MenuThumbProps) {
  const isSmall = size === 'sm'

  if (menu.colorScheme === 'dark') {
    return (
      <div
        className={cn(
          'bg-g800 flex aspect-[4/5] flex-col justify-between overflow-hidden p-3 text-white',
          className,
        )}
      >
        <p className="text-amber font-display text-[8px] tracking-[0.3em] uppercase">La Carta</p>
        <div>
          <div className="bg-amber mb-1.5 h-[1.5px] w-6" />
          <h4
            className={cn(
              'font-display leading-none font-bold italic',
              isSmall ? 'text-sm' : 'text-base',
            )}
          >
            {menu.name.split(' ').slice(0, 2).join(' ')}
          </h4>
        </div>
      </div>
    )
  }
  if (menu.colorScheme === 'cream') {
    return (
      <div
        className={cn('flex aspect-[4/5] flex-col p-3', className)}
        style={{
          background:
            'repeating-linear-gradient(45deg, var(--color-cream), var(--color-cream) 6px, color-mix(in oklab, var(--color-amber-l) 65%, var(--color-cream)) 6px, color-mix(in oklab, var(--color-amber-l) 65%, var(--color-cream)) 7px)',
        }}
      >
        <p className="text-pill-amber-fg font-display text-center text-[7px] tracking-[0.3em]">
          EST · 1902
        </p>
        <h4
          className={cn(
            'text-text font-display mt-auto text-center leading-tight font-bold italic',
            isSmall ? 'text-xs' : 'text-sm',
          )}
        >
          {menu.name}
        </h4>
      </div>
    )
  }
  if (menu.colorScheme === 'photo') {
    return (
      <div className={cn('flex aspect-[4/5] flex-col overflow-hidden bg-white', className)}>
        <div
          className="h-1/2"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in oklab, var(--color-amber) 80%, white), var(--color-amber) 50%, var(--color-pill-amber-fg))',
          }}
        />
        <div className="flex flex-1 flex-col p-3">
          <p className="text-amber text-[7px] tracking-widest uppercase">Signature</p>
          <h4
            className={cn(
              'text-text font-display mt-1 leading-tight font-bold',
              isSmall ? 'text-xs' : 'text-sm',
            )}
          >
            {menu.name}
          </h4>
        </div>
      </div>
    )
  }
  // white / minimal
  return (
    <div className={cn('flex aspect-[4/5] flex-col bg-white p-3', className)}>
      <div className="bg-text h-[1px] w-4" />
      <h4
        className={cn(
          'text-text font-display mt-auto leading-tight font-light italic',
          isSmall ? 'text-sm' : 'text-base',
        )}
      >
        {menu.name}
      </h4>
    </div>
  )
})
