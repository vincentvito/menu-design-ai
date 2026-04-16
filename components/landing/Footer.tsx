import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { BrandMark } from '@/components/brand/BrandMark'

export async function Footer() {
  const t = await getTranslations('Landing.footer')

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t('product'),
      links: [
        { href: '#how', label: t('links.features') },
        { href: '#pricing', label: t('links.pricing') },
        { href: '#samples', label: t('links.samples') },
      ],
    },
    {
      title: t('company'),
      links: [
        { href: '/about', label: t('links.about') },
        { href: '/contact', label: t('links.contact') },
        { href: '/changelog', label: t('links.changelog') },
      ],
    },
    {
      title: t('legal'),
      links: [
        { href: '/terms', label: t('links.terms') },
        { href: '/privacy', label: t('links.privacy') },
      ],
    },
  ]

  return (
    <footer className="border-brand-border bg-cream border-t">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <BrandMark size="md" />
            <p className="text-text2 mt-3 max-w-xs text-sm">{t('tagline')}</p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-text text-xs font-semibold tracking-wider uppercase">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-text2 hover:text-text text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-brand-border mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-text3 text-xs">{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  )
}
