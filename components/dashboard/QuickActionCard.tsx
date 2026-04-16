import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface QuickActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  cta?: string
  href?: string
  variant?: 'default' | 'amber' | 'green'
}

const variantMap = {
  default: {
    card: 'border-brand-border bg-card',
    icon: 'bg-g50 text-g800 ring-g100',
    cta: 'text-g800 hover:text-g700',
  },
  amber: {
    card: 'border-amber/30 bg-amber-l',
    icon: 'bg-amber text-pill-amber-fg ring-amber/30',
    cta: 'text-pill-amber-fg hover:text-amber',
  },
  green: {
    card: 'border-g600/30 bg-g50',
    icon: 'bg-g800 text-white ring-g700',
    cta: 'text-g800 hover:text-g700',
  },
} as const

export function QuickActionCard({
  icon,
  title,
  description,
  cta,
  href,
  variant = 'default',
}: QuickActionCardProps) {
  const styles = variantMap[variant]

  const body = (
    <CardContent className="flex gap-3 p-5">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1',
          styles.icon,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-display text-text text-sm font-semibold">{title}</h4>
        <p className="text-text2 mt-1 text-xs leading-relaxed">{description}</p>
        {cta && (
          <p
            className={cn(
              'mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-colors',
              styles.cta,
            )}
          >
            {cta}
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        )}
      </div>
    </CardContent>
  )

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-shadow hover:shadow-sm',
        styles.card,
      )}
    >
      {href ? <Link href={href}>{body}</Link> : body}
    </Card>
  )
}
