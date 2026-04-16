import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { Menu } from '@/lib/mock-data'

const map: Record<Menu['status'], { label: string; className: string }> = {
  active: { label: 'Active QR', className: 'bg-pill-green-bg text-pill-green-fg' },
  'print-ready': { label: 'Print-ready', className: 'bg-pill-blue-bg text-pill-blue-fg' },
  draft: { label: 'Draft', className: 'bg-pill-gray-bg text-pill-gray-fg' },
}

export const StatusPill = memo(function StatusPill({
  status,
  className,
}: {
  status: Menu['status']
  className?: string
}) {
  const entry = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        entry.className,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {entry.label}
    </span>
  )
})
