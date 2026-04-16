'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LogOut, Settings, QrCode, Plus } from 'lucide-react'
import { useSession, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getInitials } from '@/lib/format'

interface TopBarProps {
  title: string
  subtitle?: string
  locale: string
  primaryAction?: { href: string; label: string }
  secondaryAction?: { href: string; label: string }
}

export function TopBar({ title, subtitle, locale, primaryAction, secondaryAction }: TopBarProps) {
  const router = useRouter()
  const t = useTranslations('Dashboard')
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut()
    router.push('/auth/login')
  }

  const name = session?.user.name || session?.user.email || ''
  const email = session?.user.email || ''
  const initials = getInitials(name || email)

  return (
    <header className="border-brand-border bg-cream/95 supports-[backdrop-filter]:bg-cream/75 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-5 backdrop-blur-xl sm:px-8">
      <SidebarTrigger className="-ml-1" />

      <div className="min-w-0 flex-1">
        <h1 className="font-display text-text truncate text-lg leading-none font-bold">{title}</h1>
        {subtitle && (
          <p className="text-text2 mt-0.5 hidden truncate text-xs md:block">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {secondaryAction && (
          <Button
            asChild
            variant="outline"
            size="sm"
            aria-label={secondaryAction.label}
            className="border-brand-border hidden bg-white sm:inline-flex"
          >
            <Link href={secondaryAction.href}>
              <QrCode className="size-4" aria-hidden="true" />
              <span className="hidden lg:inline">{secondaryAction.label}</span>
            </Link>
          </Button>
        )}

        {primaryAction && (
          <Button
            asChild
            size="sm"
            aria-label={primaryAction.label}
            className="bg-amber text-pill-amber-fg hover:bg-amber/90 shadow-sm"
          >
            <Link href={primaryAction.href}>
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{primaryAction.label}</span>
            </Link>
          </Button>
        )}

        <LanguageSwitcher currentLocale={locale} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('accountMenu')}
              className="ring-offset-cream focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Avatar className="ring-brand-border h-9 w-9 ring-1">
                <AvatarImage src={session?.user.image || undefined} alt="" />
                <AvatarFallback className="bg-g800 text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-0.5">
                <span className="max-w-[13rem] truncate text-sm leading-none font-semibold">
                  {name || 'Account'}
                </span>
                <span className="text-muted-foreground max-w-[13rem] truncate text-xs leading-none">
                  {email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="size-4" aria-hidden="true" />
                {t('settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <LogOut className="size-4" aria-hidden="true" />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
