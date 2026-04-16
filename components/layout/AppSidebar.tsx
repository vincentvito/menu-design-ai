'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, Sparkles, BookOpen, Share2, QrCode, Crown } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { BrandMark } from '@/components/brand/BrandMark'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const t = useTranslations('Sidebar')
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', label: t('dashboard'), Icon: LayoutDashboard },
    { href: '/dashboard/menus/new', label: t('create'), Icon: Sparkles },
    { href: '/dashboard/menus', label: t('menus'), Icon: BookOpen },
    { href: '/dashboard/social', label: t('social'), Icon: Share2 },
    { href: '/dashboard/qr', label: t('qr'), Icon: QrCode },
  ]

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon" className="bg-sidebar border-sidebar-border border-r">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
        <Link
          href="/"
          className="group/brand flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
        >
          <BrandMark size="md" className="text-white group-data-[collapsible=icon]:hidden" />
          <div className="bg-amber text-pill-amber-fg hidden size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold group-data-[collapsible=icon]:flex">
            M
          </div>
        </Link>
        <p className="text-sidebar-foreground/60 font-display text-xs italic group-data-[collapsible=icon]:hidden">
          {t('brand')}
        </p>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-2">
          <SidebarGroupContent className="group-data-[collapsible=icon]:w-auto">
            <SidebarMenu className="group-data-[collapsible=icon]:gap-1.5">
              {items.map((item) => {
                const active = isActive(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={cn(
                        'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground h-9',
                        'group-data-[collapsible=icon]:justify-center',
                        active && 'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                      data-active={active}
                    >
                      <Link href={item.href}>
                        <item.Icon className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
        <Link
          href="/dashboard/billing"
          aria-label={`${t('plan')} — ${t('upgrade')}`}
          className={cn(
            'bg-sidebar-accent/40 hover:bg-sidebar-accent border-sidebar-border/50 group/plan flex items-center gap-3 rounded-lg border p-3 transition-colors',
            'group-data-[collapsible=icon]:bg-amber group-data-[collapsible=icon]:hover:bg-amber group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0',
          )}
        >
          <div className="bg-amber text-pill-amber-fg flex size-8 shrink-0 items-center justify-center rounded-md group-data-[collapsible=icon]:size-full group-data-[collapsible=icon]:bg-transparent">
            <Crown className="size-4" />
          </div>
          <div className="flex-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between">
              <p className="text-sidebar-foreground text-xs font-semibold">{t('plan')}</p>
              <Badge
                variant="secondary"
                className="bg-amber-l text-pill-amber-fg h-5 border-0 px-1.5 text-[10px]"
              >
                Starter
              </Badge>
            </div>
            <p className="text-sidebar-foreground/60 mt-0.5 text-[11px]">{t('upgrade')} →</p>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
