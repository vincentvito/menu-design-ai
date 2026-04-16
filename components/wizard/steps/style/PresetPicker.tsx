'use client'

import { useRef } from 'react'
import { Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Preset } from '@/lib/menu-config/presets'
import type { SelectableValue } from '@/lib/menu-config/types'

interface Props {
  presets: Preset[]
  value: SelectableValue | null
  onChange: (value: SelectableValue | null) => void
  /** Show hints under preset labels when available. */
  showHints?: boolean
  placeholder?: string
  className?: string
  ariaLabel?: string
}

export function PresetPicker({
  presets,
  value,
  onChange,
  showHints,
  placeholder = 'Type your own…',
  className,
  ariaLabel,
}: Props) {
  const isCustom = !!value?.custom
  const inputRef = useRef<HTMLInputElement>(null)

  function selectPreset(id: string) {
    onChange({ value: id, custom: false })
  }

  function openCustom() {
    onChange({ value: value?.custom ? value.value : '', custom: true })
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className={cn('space-y-3', className)} role="group" aria-label={ariaLabel}>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = !isCustom && value?.value === p.id
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => selectPreset(p.id)}
              className={cn(
                'border-brand-border bg-card text-text2 hover:border-g800/40 flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                active && 'border-g800 bg-g800/5 text-text ring-g800/30 ring-2',
              )}
            >
              <span className="font-medium">{p.label}</span>
              {showHints && p.hint && (
                <span className="text-text2 mt-0.5 text-xs opacity-80">{p.hint}</span>
              )}
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={isCustom}
          onClick={openCustom}
          className={cn(
            'border-brand-border bg-card text-text2 hover:border-g800/40 inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors',
            isCustom && 'border-g800 bg-g800/5 text-text ring-g800/30 ring-2',
          )}
        >
          <Pencil className="size-3.5" />
          Write your own
        </button>
      </div>

      {isCustom && (
        <Input
          ref={inputRef}
          value={value?.value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange({ value: e.target.value, custom: true })}
        />
      )}
    </div>
  )
}
