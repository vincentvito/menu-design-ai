'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
}

const SUGGESTIONS = [
  'Appetizers',
  'Starters',
  'Mains',
  'Entrées',
  'Sides',
  'Desserts',
  'Drinks',
  'Cocktails',
  'Wine',
  'Beer',
]

export function SectionsEditor({ value, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const has = (name: string) => value.some((v) => v.toLowerCase() === name.toLowerCase())

  function add(name: string) {
    const v = name.trim()
    if (!v || has(v)) return
    onChange([...value, v])
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-2">
        {value.map((name, i) => (
          <li
            key={`${name}-${i}`}
            className="border-brand-border bg-g800/5 inline-flex items-center gap-2 rounded-full border py-1 pr-1 pl-3 text-sm"
          >
            <span className="text-text">{name}</span>
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onClick={() => remove(i)}
              className="text-text2 hover:bg-brand-border hover:text-text rounded-full p-1"
            >
              <X className="size-3" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder="Add a section (e.g. Small plates, Tasting menu)…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(draft)
              setDraft('')
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            add(draft)
            setDraft('')
          }}
          disabled={!draft.trim()}
          className="border-brand-border bg-card hover:bg-g800/5 inline-flex items-center gap-1 rounded-lg border px-3 text-sm font-medium disabled:opacity-50"
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.filter((s) => !has(s)).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            className="text-text2 hover:text-text hover:border-g800/40 border-brand-border rounded-full border border-dashed px-2.5 py-0.5 text-xs"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  )
}
