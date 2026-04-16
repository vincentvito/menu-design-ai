'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Clock, Timer, Flame, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { SAMPLE_QR_STATS } from '@/lib/mock-data'

export function ScanAnalytics() {
  const t = useTranslations('QR.analytics')
  const stats = SAMPLE_QR_STATS
  const days = t.raw('days') as string[]

  const { max, peakIndex, total } = useMemo(() => {
    let maxVal = 0
    let peakIdx = 0
    let sum = 0
    stats.last7Days.forEach((v, i) => {
      if (v > maxVal) {
        maxVal = v
        peakIdx = i
      }
      sum += v
    })
    return { max: maxVal, peakIndex: peakIdx, total: sum }
  }, [stats.last7Days])

  const chartCaptionId = 'scan-chart-caption'

  return (
    <div className="space-y-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('peakHour')}
          value={stats.peakHour}
          accent="green"
          icon={<Clock className="size-4" />}
        />
        <StatCard
          label={t('avgSession')}
          value={stats.avgSession}
          accent="blue"
          icon={<Timer className="size-4" />}
        />
        <StatCard
          label={t('topItem')}
          value={stats.topItem}
          accent="amber"
          icon={<Flame className="size-4" />}
        />
        <StatCard
          label={t('unique')}
          value={formatNumber(stats.uniqueVisitors)}
          accent="neutral"
          icon={<Users className="size-4" />}
        />
      </div>

      {/* Bar chart */}
      <Card className="border-brand-border bg-card p-5">
        <figure aria-labelledby={chartCaptionId}>
          <figcaption id={chartCaptionId} className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-text text-sm font-semibold">{t('title')}</h3>
            <p className="text-text2 text-xs">
              {formatNumber(total)} scans · peak {days[peakIndex]} · {formatNumber(max)}
            </p>
          </figcaption>

          <div className="mt-5 flex h-40 items-end gap-2" role="presentation" aria-hidden="true">
            {stats.last7Days.map((value, i) => {
              const height = `${(value / max) * 100}%`
              const peak = i === peakIndex
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={cn(
                      'min-h-[4px] w-full rounded-t-md transition-all',
                      peak ? 'bg-amber' : 'bg-g600/30',
                    )}
                    style={{ height }}
                  />
                  <span className="text-text3 text-[10px] font-medium uppercase">{days[i]}</span>
                  <span
                    className={cn(
                      'font-mono text-[10px]',
                      peak ? 'text-amber font-bold' : 'text-text2',
                    )}
                  >
                    {value}
                  </span>
                </div>
              )
            })}
          </div>

          {/* SR-only data table mirroring the chart */}
          <table className="sr-only">
            <caption>{t('title')}</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Scans</th>
              </tr>
            </thead>
            <tbody>
              {stats.last7Days.map((value, i) => (
                <tr key={i}>
                  <th scope="row">{days[i]}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </Card>
    </div>
  )
}
