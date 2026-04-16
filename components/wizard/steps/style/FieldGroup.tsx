import { cn } from '@/lib/utils'

interface Props {
  title: string
  description?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FieldGroup({ title, description, required, className, children }: Props) {
  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h3 className="font-display text-text text-sm font-semibold">
          {title}
          {required && <span className="text-pill-red-fg ml-1">*</span>}
        </h3>
        {description && <p className="text-text2 mt-1 text-xs">{description}</p>}
      </div>
      {children}
    </section>
  )
}
