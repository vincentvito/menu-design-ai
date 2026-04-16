/**
 * Model-tuned prompt builder for Replicate image generation (qwen/qwen-image-2).
 *
 * qwen-image-2 supports prompts up to ~1k tokens and renders text reliably when
 * the exact strings to render are quoted inline. We inline every dish name,
 * description, and price verbatim so the model has no room to hallucinate copy.
 *
 * Structure:
 *   1. Identity (one sentence)
 *   2. Concept + variant direction
 *   3. Visual direction (art / color / typography, compact)
 *   4. TEXT TO RENDER block — literal quoted strings for title + every item
 *   5. Technical/print constraints
 */

import {
  COPY_TONE_PRESETS,
  CUISINE_PRESETS,
  LANGUAGE_PRESETS,
  PALETTE_PRESETS,
  RESTAURANT_TYPE_PRESETS,
  RTL_LANGUAGES,
  VIBE_PRESETS,
  type Preset,
} from '@/lib/menu-config/presets'
import type {
  CuisineSelection,
  MenuConfig,
  PriceDisplay,
  SelectableValue,
} from '@/lib/menu-config/types'
import type { DietaryTag, MenuItem } from '@/lib/mock-data'
import type { VariantPersonality } from './variants'

/* ---------------------------------- helpers --------------------------------- */

function presetLabel(presets: Preset[], id: string): string {
  return presets.find((p) => p.id === id)?.label ?? id
}

function resolveSelectable(v: SelectableValue | null, presets: Preset[]): string | null {
  if (!v) return null
  if (v.custom) return v.value.trim() || null
  return presetLabel(presets, v.value)
}

function formatCuisine(c: CuisineSelection): string {
  const label = c.custom ? c.value : presetLabel(CUISINE_PRESETS, c.value)
  return c.regional?.trim() ? `${label} (${c.regional.trim()})` : label
}

function joinList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function formatPrice(price: number, display: PriceDisplay): string | null {
  if (display === 'hidden') return null
  if (display === 'numeric') return price.toString()
  return `$${price}`
}

function formatTags(tags: DietaryTag[], enabled: boolean): string {
  if (!enabled || tags.length === 0) return ''
  return ` [${tags.join(' · ')}]`
}

function groupItemsBySection(
  config: MenuConfig,
  items: MenuItem[],
): Array<{ name: string; items: MenuItem[] }> {
  const byCategory = new Map<string, MenuItem[]>()
  for (const it of items) {
    const key = it.category.trim() || 'Other'
    const bucket = byCategory.get(key) ?? []
    bucket.push(it)
    byCategory.set(key, bucket)
  }
  const orderHint = config.structure.sections.map((s) => s.toLowerCase())
  const rank = (name: string) => {
    const i = orderHint.indexOf(name.toLowerCase())
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  return Array.from(byCategory.entries())
    .map(([name, its]) => ({ name, items: its }))
    .sort((a, b) => rank(a.name) - rank(b.name))
}

/* ---------------------------------- sections -------------------------------- */

function buildIdentity(config: MenuConfig): string {
  const name = config.restaurantName.trim() || 'the restaurant'
  const cuisines = config.cuisines.map(formatCuisine)
  const cuisineClause =
    cuisines.length === 0
      ? ''
      : cuisines.length > 1
        ? ` serving a fusion of ${joinList(cuisines)}`
        : ` serving ${cuisines[0]} cuisine`
  return `A professional printed restaurant menu design for "${name}"${cuisineClause}.`
}

function buildConcept(config: MenuConfig, variant: VariantPersonality): string {
  const restaurantType = resolveSelectable(config.restaurantType, RESTAURANT_TYPE_PRESETS)
  const vibe = resolveSelectable(config.vibe, VIBE_PRESETS)
  const parts: string[] = []
  if (restaurantType && vibe) {
    parts.push(
      `Concept: "${restaurantType}" crossed with a "${vibe}" vibe. Restaurant type drives structural density; vibe drives typography and palette — both must be visible.`,
    )
  } else if (restaurantType) {
    parts.push(`Concept: ${restaurantType}.`)
  } else if (vibe) {
    parts.push(`Concept vibe: ${vibe}.`)
  }
  parts.push(`Design direction — ${variant.label}: ${variant.directive}`)
  return parts.join(' ')
}

function buildVisualDirection(config: MenuConfig): string {
  const palette = resolveSelectable(config.palette, PALETTE_PRESETS)
  const tone = resolveSelectable(config.copyTone, COPY_TONE_PRESETS)

  const densityDirective: Record<MenuConfig['contentDensity'], string> = {
    'text-only':
      'Typography-led layout with no photographic imagery — letterforms, rules, and negative space carry the composition.',
    'text-accents':
      'Primarily typographic with small restrained accents (thin rules, ornamental dividers). No large photography.',
    'text-imagery':
      'Image-forward layout with editorial food photography (natural light, shallow depth of field, realistic textures). No plastic-looking dishes.',
  }

  const paletteClause = palette
    ? ` Color system: "${palette}" — one dominant background tone, one strong type color, one accent for dividers and prices.`
    : ''
  const toneClause = tone ? ` Copy voice: ${tone}.` : ''

  return [
    'Visual direction:',
    densityDirective[config.contentDensity],
    'Crisp typography with clear hierarchy: title largest, section headers medium, dish names bold, descriptions lighter.',
    paletteClause.trim(),
    toneClause.trim(),
  ]
    .filter(Boolean)
    .join(' ')
}

function buildLiteralTextBlock(config: MenuConfig, items: MenuItem[]): string {
  const name = config.restaurantName.trim() || 'Restaurant'
  const lines: string[] = [
    'TEXT TO RENDER IN THE IMAGE — every quoted string below must appear exactly as written, spelled correctly, no paraphrasing, no invented dishes, no lorem ipsum:',
    '',
    `• Title at top of page: "${name}"`,
  ]

  const cuisines = config.cuisines.map(formatCuisine)
  if (cuisines.length > 0) {
    lines.push(`• Subtitle under title: "${joinList(cuisines)}"`)
  }

  if (items.length === 0) {
    lines.push('')
    lines.push(
      'No item list was provided. Invent a short, plausible menu of 6–10 dishes consistent with the cuisine above and render them with legible names, descriptions, and prices.',
    )
    return lines.join('\n')
  }

  const groups = groupItemsBySection(config, items)
  for (const group of groups) {
    lines.push('')
    lines.push(`Section heading: "${group.name.toUpperCase()}"`)
    for (const it of group.items) {
      const price = formatPrice(it.price, config.priceDisplay)
      const tags = formatTags(it.tags, config.structure.dietaryIcons)
      const segments: string[] = [`"${it.name}"${tags}`]
      if (it.description.trim()) segments.push(`"${it.description.trim()}"`)
      if (price) segments.push(price)
      lines.push(`  · ${segments.join(' — ')}`)
    }
  }

  const extras: string[] = []
  if (config.structure.prixFixe) extras.push('a dedicated prix-fixe block with a single set price')
  if (config.structure.tastingMenu) extras.push('a tasting-menu block')
  if (config.structure.pairingSuggestions)
    extras.push('short drink-pairing notes under selected dishes')
  if (config.structure.chefsNotes) extras.push("a short chef's-notes paragraph")
  if (config.structure.dietaryIcons)
    extras.push(
      'small dietary markers next to dish names (V = vegetarian, VG = vegan, GF = gluten-free, DF = dairy-free, NF = nut-free)',
    )

  if (extras.length > 0) {
    lines.push('')
    lines.push(`Also include: ${joinList(extras)}.`)
  }

  lines.push('')
  lines.push(
    'Every quoted string above MUST appear in the final image, legible and spelled correctly, in the order shown. Do not drop items. Do not repeat items. Do not substitute names.',
  )
  return lines.join('\n')
}

function buildLocalization(config: MenuConfig): string {
  const primary = presetLabel(LANGUAGE_PRESETS, config.language.primary)
  const secondary = config.language.secondary
    ? presetLabel(LANGUAGE_PRESETS, config.language.secondary)
    : null
  const isRtl =
    RTL_LANGUAGES.has(config.language.primary) ||
    (!!config.language.secondary && RTL_LANGUAGES.has(config.language.secondary))

  const parts: string[] = []
  if (secondary) {
    parts.push(
      `Bilingual menu: render every section heading and dish name in both ${primary} and ${secondary}, with consistent parallel alignment.`,
    )
  } else {
    parts.push(`All text in ${primary}.`)
  }
  if (isRtl) {
    parts.push(
      'Right-to-left layout: mirror column order, align text to the right, flip decorative directional elements.',
    )
  }
  return parts.join(' ')
}

function buildTechnical(config: MenuConfig): string {
  const formatLine =
    config.format === 'a4'
      ? 'Portrait A4 poster (210 × 297 mm), print-ready sharpness.'
      : `Format: ${config.format}, print-ready.`
  return (
    `Technical: ${formatLine} The entire canvas IS the finished menu, edge to edge. ` +
    'Flat 2D graphic design, NOT a photograph of a printed menu — no perspective, no mockup, no paper curl, no clipboard, no staged shadows. ' +
    'No watermarks, signatures, or artist credits.'
  )
}

/* ----------------------------------- public --------------------------------- */

/** Compose the full prompt string for a single variant. */
export function buildReplicatePrompt(
  config: MenuConfig,
  items: MenuItem[],
  variant: VariantPersonality,
): string {
  return [
    buildIdentity(config),
    buildConcept(config, variant),
    buildVisualDirection(config),
    buildLocalization(config),
    buildLiteralTextBlock(config, items),
    buildTechnical(config),
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** Shared negative-style directive passed via `negative_prompt`. */
export const DEFAULT_NEGATIVE_PROMPT =
  'garbled text, misspelled words, malformed letters, gibberish, duplicated words, lorem ipsum, placeholder copy, ' +
  'watermarks, signatures, artist credits, ' +
  '3D rendering, photograph of a physical printed menu, clipboard, paper curl, perspective distortion, staged shadows, ' +
  'plastic-looking food, oversaturated colors, cluttered backgrounds'

/**
 * qwen-image-2 supports: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 2:1, 1:2.
 * A4 is 1 : 1.414; closest is "3:4" (1 : 1.333). Minor letterbox when printing.
 */
export function aspectRatioForFormat(format: MenuConfig['format']): string {
  switch (format) {
    case 'a4':
      return '3:4'
    default:
      return '3:4'
  }
}
