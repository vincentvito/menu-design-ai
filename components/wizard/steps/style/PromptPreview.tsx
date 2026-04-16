'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildReplicatePrompt } from '@/lib/ai/menu-prompts'
import { VARIANTS } from '@/lib/ai/variants'
import type { MenuConfig } from '@/lib/menu-config/types'
import type { MenuItem } from '@/lib/mock-data'

interface Props {
  config: MenuConfig
  items: MenuItem[]
}

export function PromptPreview({ config, items }: Props) {
  const [open, setOpen] = useState(false)
  const [variantIndex, setVariantIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const prompts = useMemo(
    () => VARIANTS.map((v) => buildReplicatePrompt(config, items, v)),
    [config, items],
  )
  const active = prompts[variantIndex]
  const activeVariant = VARIANTS[variantIndex]

  async function copy() {
    try {
      await navigator.clipboard.writeText(active)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <div className="border-brand-border bg-cream/40 overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="hover:bg-g800/5 flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="text-text2 size-4" />
          ) : (
            <ChevronRight className="text-text2 size-4" />
          )}
          <span className="font-display text-text text-sm font-semibold">Prompt preview</span>
          <span className="text-text2 text-xs">Exact prompt sent to the image model</span>
        </span>
        <span className="text-text2 text-xs tabular-nums">{active.length} chars</span>
      </button>

      {open && (
        <div className="border-brand-border relative border-t">
          <div className="bg-card/60 border-brand-border flex items-center gap-1 border-b px-3 py-2">
            {VARIANTS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantIndex(i)}
                aria-pressed={i === variantIndex}
                className={cn(
                  'text-text2 hover:text-text rounded-md px-2.5 py-1 text-xs transition-colors',
                  i === variantIndex && 'bg-g800/10 text-text font-medium',
                )}
              >
                {v.label}
              </button>
            ))}
            <span className="text-text2 ml-auto text-xs italic">{activeVariant.tagline}</span>
          </div>
          <button
            type="button"
            onClick={copy}
            className={cn(
              'border-brand-border bg-card text-text2 hover:text-text absolute top-12 right-3 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
              copied && 'text-pill-green-fg border-pill-green-fg/30',
            )}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <pre className="text-text2 max-h-96 overflow-auto px-4 py-4 pr-20 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
            {active}
          </pre>
        </div>
      )}
    </div>
  )
}
