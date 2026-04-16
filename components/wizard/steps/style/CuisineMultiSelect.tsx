'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CUISINE_PRESETS, type Preset } from '@/lib/menu-config/presets'
import type { CuisineSelection } from '@/lib/menu-config/types'

interface Props {
  value: CuisineSelection[]
  onChange: (next: CuisineSelection[]) => void
}

function findPreset(id: string): Preset | undefined {
  return CUISINE_PRESETS.find((p) => p.id === id)
}

export function CuisineMultiSelect({ value, onChange }: Props) {
  const [customDraft, setCustomDraft] = useState('')

  const selectedKeys = new Set(value.filter((c) => !c.custom).map((c) => c.value))

  function togglePreset(id: string) {
    if (selectedKeys.has(id)) {
      onChange(value.filter((c) => !(c.value === id && !c.custom)))
    } else {
      onChange([...value, { value: id, custom: false }])
    }
  }

  function addCustom() {
    const v = customDraft.trim()
    if (!v) return
    if (value.some((c) => c.custom && c.value.toLowerCase() === v.toLowerCase())) return
    onChange([...value, { value: v, custom: true }])
    setCustomDraft('')
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function setRegional(index: number, regional: string) {
    onChange(value.map((c, i) => (i === index ? { ...c, regional } : c)))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CUISINE_PRESETS.map((p) => {
          const active = selectedKeys.has(p.id)
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => togglePreset(p.id)}
              className={cn(
                'border-brand-border bg-card text-text2 hover:border-g800/40 rounded-full border px-3 py-1.5 text-sm transition-colors',
                active && 'border-g800 bg-g800/10 text-text',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Input
          value={customDraft}
          placeholder="Add a cuisine not listed (e.g. Nikkei fusion, Modern Australian)…"
          onChange={(e) => setCustomDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customDraft.trim()}
          className="border-brand-border bg-card hover:bg-g800/5 inline-flex items-center gap-1 rounded-lg border px-3 text-sm font-medium disabled:opacity-50"
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-text2 text-xs font-medium tracking-wide uppercase">Selected</p>
          <ul className="space-y-2">
            {value.map((c, i) => {
              const preset = !c.custom ? findPreset(c.value) : null
              const label = preset?.label ?? c.value
              const regionalHint = preset?.hint
              return (
                <li
                  key={`${c.custom ? 'x' : 'p'}-${c.value}-${i}`}
                  className="border-brand-border bg-card flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-[140px] flex-shrink-0">
                    <span className="text-text text-sm font-medium">{label}</span>
                    {c.custom && (
                      <span className="text-text2 ml-2 text-xs opacity-70">(custom)</span>
                    )}
                  </div>
                  <Input
                    value={c.regional ?? ''}
                    placeholder={regionalHint ?? 'Regional style (optional)'}
                    onChange={(e) => setRegional(i, e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${label}`}
                    onClick={() => remove(i)}
                    className="text-text2 hover:text-pill-red-fg self-end rounded-md p-2 sm:self-auto"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
