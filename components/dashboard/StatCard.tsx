import { memo } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  trend?: number
  icon?: React.ReactNode
  accent?: 'green' | 'amber' | 'blue' | 'neutral'
}

const accentMap = {
  green: 'bg-pill-green-bg text-pill-green-fg',
  amber: 'bg-pill-amber-bg text-pill-amber-fg',
  blue: 'bg-pill-blue-bg text-pill-blue-fg',
  neutral: 'bg-pill-gray-bg text-pill-gray-fg',
} as const

export const StatCard = memo(function StatCard({
  label,
  value,
  hint,
  trend,
  icon,
  accent = 'green',
}: StatCardProps) {
  const TrendIcon = trend !== undefined && trend < 0 ? TrendingDown : TrendingUp
  const trendPositive = trend !== undefined && trend >= 0

  return (
    <Card className="border-brand-border bg-card relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-text2 text-xs font-medium tracking-wide uppercase">{label}</p>
          {icon && (
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                accentMap[accent],
              )}
            >
              {icon}
            </div>
          )}
        </div>
        <p className="font-display text-text mt-3 text-3xl leading-none font-bold">{value}</p>
        <div className="mt-2 flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold',
                trendPositive ? 'text-pill-green-fg' : 'text-destructive',
              )}
            >
              <TrendIcon className="size-3" />
              {Math.abs(trend)}%
            </span>
          )}
          {hint && <span className="text-text3 text-xs">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  )
})
