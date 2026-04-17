'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ArrowLeft, Download, QrCode, Share2, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { StatusPill } from '@/components/dashboard/StatusPill'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatPrice, timeAgo } from '@/lib/format'
import type { MenuDetail } from '@/lib/menus/detail'

interface Props {
  menu: MenuDetail
}

export function MenuDetailView({ menu }: Props) {
  const locale = useLocale()
  const readyPreviews = menu.predictions.filter((p) => p.status === 'succeeded' && p.imageUrl)
  const [selectedId, setSelectedId] = useState<string | null>(readyPreviews[0]?.id ?? null)

  const grouped = useMemo(() => {
    const byCategory = new Map<string, typeof menu.items>()
    for (const item of menu.items) {
      const key = item.category || 'Other'
      if (!byCategory.has(key)) byCategory.set(key, [])
      byCategory.get(key)!.push(item)
    }
    return Array.from(byCategory.entries())
  }, [menu.items])

  return (
    <>
      <TopBar
        title={menu.name}
        subtitle={`${menu.style} · ${menu.items.length} items · Updated ${timeAgo(menu.updatedAt)}`}
        locale={locale}
        primaryAction={{ href: '/dashboard/menus/new', label: 'New menu' }}
      />

      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        {/* Back + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="text-text2 hover:text-text -ml-2">
            <Link href="/dashboard/menus">
              <ArrowLeft className="size-4" />
              Back to menus
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={menu.status} />
            <Button variant="outline" size="sm" className="border-brand-border bg-white" disabled>
              <Share2 className="size-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="border-brand-border bg-white" disabled>
              <QrCode className="size-4" />
              QR menu
            </Button>
            <Button size="sm" className="bg-amber text-pill-amber-fg hover:bg-amber/90" disabled>
              <Download className="size-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Preview column */}
          <div>
            <MenuPreview menu={menu} selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          {/* Config + items column */}
          <div className="space-y-6">
            <ConfigCard menu={menu} />
            <ItemsCard grouped={grouped} />
          </div>
        </div>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Preview                                                                     */
/* -------------------------------------------------------------------------- */

function MenuPreview({
  menu,
  selectedId,
  onSelect,
}: {
  menu: MenuDetail
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const selected = menu.predictions.find((p) => p.id === selectedId) ?? menu.predictions[0]

  if (!selected) {
    return (
      <Card className="border-brand-border bg-card flex aspect-[3/4] items-center justify-center p-8 text-center">
        <div>
          <Sparkles className="text-text3 mx-auto size-6" aria-hidden="true" />
          <p className="text-text2 mt-3 text-sm">No designs generated yet.</p>
        </div>
      </Card>
    )
  }

  const hasMultiple = menu.predictions.length > 1

  return (
    <div className="space-y-4">
      <Card className="border-brand-border bg-card relative aspect-[3/4] overflow-hidden p-0">
        {selected.status === 'succeeded' && selected.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.imageUrl}
            alt={`${menu.name} — ${selected.variantLabel}`}
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : selected.status === 'failed' || selected.status === 'canceled' ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <AlertCircle className="text-destructive size-6" aria-hidden="true" />
            <p className="text-text2 text-sm">
              {selected.error || 'This design failed to generate.'}
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2 className="text-g800 size-6 animate-spin" aria-hidden="true" />
            <p className="text-text2 text-xs">
              {selected.status === 'starting' ? 'Queued…' : 'Generating…'}
            </p>
          </div>
        )}
      </Card>

      {hasMultiple && (
        <div className="grid grid-cols-2 gap-3">
          {menu.predictions.map((p) => {
            const active = p.id === selected.id
            const disabled = !(p.status === 'succeeded' && p.imageUrl)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => !disabled && onSelect(p.id)}
                disabled={disabled}
                aria-pressed={active}
                className={cn(
                  'group border-brand-border bg-card relative flex items-center gap-3 overflow-hidden rounded-xl border p-2 text-left transition-all',
                  active && 'ring-g800 border-g800 ring-2',
                  disabled && 'cursor-default opacity-60',
                  !disabled && !active && 'hover:border-g600/50',
                )}
              >
                <div className="bg-cream/60 relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-md">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-text truncate text-sm font-semibold">
                    {p.variantLabel}
                  </p>
                  <p className="text-text3 mt-0.5 text-[11px] capitalize">{p.status}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Config + items                                                              */
/* -------------------------------------------------------------------------- */

function ConfigCard({ menu }: { menu: MenuDetail }) {
  const { config } = menu
  const cuisines = config.cuisines?.map((c) => c.value).filter(Boolean) ?? []

  const rows = [
    ['Cuisine', cuisines.length ? cuisines.join(', ') : '—'],
    ['Vibe', config.vibe?.value || '—'],
    ['Restaurant type', config.restaurantType?.value || '—'],
    ['Palette', config.palette?.value || '—'],
    ['Copy tone', config.copyTone?.value || '—'],
    ['Content density', prettyDensity(config.contentDensity)],
    ['Price display', prettyPrice(config.priceDisplay)],
    [
      'Language',
      config.language.secondary
        ? `${config.language.primary.toUpperCase()} + ${config.language.secondary.toUpperCase()}`
        : config.language.primary.toUpperCase(),
    ],
    ['Format', config.format.toUpperCase()],
  ] as const

  return (
    <Card className="border-brand-border bg-card p-5">
      <h2 className="font-display text-text text-base font-semibold">Configuration</h2>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="text-text3 text-xs font-medium tracking-wide uppercase">{label}</dt>
            <dd className="text-text truncate">{value}</dd>
          </Fragment>
        ))}
      </dl>
    </Card>
  )
}

function ItemsCard({ grouped }: { grouped: [string, MenuDetail['items']][] }) {
  if (grouped.length === 0) {
    return (
      <Card className="border-brand-border bg-card p-5">
        <h2 className="font-display text-text text-base font-semibold">Items</h2>
        <p className="text-text2 mt-3 text-sm">No items captured for this menu.</p>
      </Card>
    )
  }

  return (
    <Card className="border-brand-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-text text-base font-semibold">Items</h2>
        <span className="text-text3 text-xs">
          {grouped.reduce((sum, [, items]) => sum + items.length, 0)} total
        </span>
      </div>

      <div className="mt-4 space-y-5">
        {grouped.map(([category, items]) => (
          <section key={category}>
            <h3 className="text-text2 text-[11px] font-semibold tracking-[0.14em] uppercase">
              {category}
            </h3>
            <ul className="border-brand-border/60 mt-2 divide-y">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-text text-sm font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-text2 mt-0.5 line-clamp-2 text-xs">{item.description}</p>
                    )}
                  </div>
                  <span className="text-text font-mono text-xs whitespace-nowrap tabular-nums">
                    {typeof item.price === 'number' ? formatPrice(item.price) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  )
}

function prettyDensity(d: MenuDetail['config']['contentDensity']): string {
  switch (d) {
    case 'text-only':
      return 'Text only'
    case 'text-accents':
      return 'Text + accents'
    case 'text-imagery':
      return 'Text + imagery'
  }
}

function prettyPrice(p: MenuDetail['config']['priceDisplay']): string {
  switch (p) {
    case 'symbol':
      return 'Currency symbol'
    case 'numeric':
      return 'Numeric only'
    case 'hidden':
      return 'Hidden (prix fixe)'
  }
}
