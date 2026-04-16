import { memo } from 'react'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  accent?: 'amber' | 'cream'
}

const sizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
}

/**
 * Brand wordmark: "Menu" (serif) + "AI" (serif, amber).
 * Used in nav, auth pages, sidebar, emails.
 */
export const BrandMark = memo(function BrandMark({
  className,
  size = 'md',
  accent = 'amber',
}: BrandMarkProps) {
  return (
    <span
      className={cn(
        'font-display inline-flex items-baseline font-bold tracking-tight',
        sizes[size],
        className,
      )}
    >
      Menu
      <span className={cn(accent === 'amber' ? 'text-amber' : 'text-cream')}>AI</span>
    </span>
  )
})
