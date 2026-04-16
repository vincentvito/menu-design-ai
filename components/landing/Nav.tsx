import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/BrandMark'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { MobileNav } from './MobileNav'

interface NavProps {
  locale: string
}

export async function Nav({ locale }: NavProps) {
  const t = await getTranslations('Nav')

  const links = [
    { href: '#how', label: t('howItWorks') },
    { href: '#samples', label: t('samples') },
    { href: '#pricing', label: t('pricing') },
  ]

  return (
    <nav className="landing-nav border-border/60 bg-cream/95 supports-[backdrop-filter]:bg-cream/75 fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[opacity,transform] duration-500 ease-out">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link href="/" className="inline-flex items-center">
          <BrandMark size="md" />
        </Link>

        {/* Anchor links (desktop) */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher currentLocale={locale} />
          </div>

          <Link
            href="/auth/login"
            className="text-muted-foreground hover:text-foreground hidden px-2 text-sm font-medium transition-colors md:block"
          >
            {t('signIn')}
          </Link>

          {/* Primary CTA — always visible */}
          <Button
            asChild
            size="sm"
            className="bg-amber text-pill-amber-fg hover:bg-amber/90 hidden shadow-sm sm:inline-flex"
          >
            <Link href="/auth/login">{t('startTrial')}</Link>
          </Button>

          {/* Mobile: hamburger */}
          <MobileNav
            links={links}
            signInLabel={t('signIn')}
            ctaLabel={t('startTrial')}
            menuLabel={t('openMenu')}
          />
        </div>
      </div>
    </nav>
  )
}
