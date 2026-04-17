/**
 * Prompt builder for Replicate image generation (google/nano-banana-2).
 *
 * Structure:
 *   1. Identity (one sentence)
 *   2. Concept + variant direction (with per-preset typographic directives)
 *   3. Visual direction (art / color / typography, compact)
 *      · if content-density = text-imagery, also name 2–3 focal dishes to photograph
 *   4. Localization
 *   5. TEXT TO RENDER block — literal quoted strings for title + every item
 *   6. Technical/print constraints
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

interface Resolved {
  /** Human-readable label (preset label, or the custom string). */
  label: string
  /** Prompt-only directive if a preset with one was selected; null for custom. */
  directive: string | null
}

function findPreset(presets: Preset[], id: string): Preset | null {
  return presets.find((p) => p.id === id) ?? null
}

function presetLabel(presets: Preset[], id: string): string {
  return findPreset(presets, id)?.label ?? id
}

function resolveSelectable(v: SelectableValue | null, presets: Preset[]): Resolved | null {
  if (!v) return null
  if (v.custom) {
    const label = v.value.trim()
    return label ? { label, directive: null } : null
  }
  const preset = findPreset(presets, v.value)
  if (!preset) return null
  return { label: preset.label, directive: preset.directive ?? null }
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

function formatPrice(price: number, display: PriceDisplay, currencySymbol: string): string | null {
  if (display === 'hidden') return null
  if (display === 'numeric') return price.toString()
  const sym = currencySymbol.trim()
  return sym ? `${sym}${price}` : price.toString()
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

/**
 * Pick up to `n` "signature" dishes to single out for photography when the
 * brief asks for image-forward density. Preference: explicitly featured items,
 * then the highest-priced item in each section, then the first item overall.
 */
function pickFocalDishes(items: MenuItem[], n = 3): MenuItem[] {
  if (items.length === 0) return []
  const picked: MenuItem[] = []
  const seen = new Set<string>()
  const take = (it: MenuItem | undefined) => {
    if (!it || seen.has(it.id) || picked.length >= n) return
    picked.push(it)
    seen.add(it.id)
  }

  for (const it of items) if (it.featured) take(it)

  if (picked.length < n) {
    const byCategory = new Map<string, MenuItem[]>()
    for (const it of items) {
      const bucket = byCategory.get(it.category) ?? []
      bucket.push(it)
      byCategory.set(it.category, bucket)
    }
    for (const bucket of byCategory.values()) {
      const top = [...bucket].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0]
      take(top)
    }
  }

  for (const it of items) take(it)
  return picked.slice(0, n)
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

function buildConcept(config: MenuConfig): string {
  const restaurantType = resolveSelectable(config.restaurantType, RESTAURANT_TYPE_PRESETS)
  const vibe = resolveSelectable(config.vibe, VIBE_PRESETS)

  const parts: string[] = []

  if (restaurantType && vibe) {
    parts.push(
      `Concept: "${restaurantType.label}" crossed with a "${vibe.label}" vibe. ` +
        'Restaurant type drives structural density; vibe drives typography and palette — both must be visible.',
    )
  } else if (restaurantType) {
    parts.push(`Concept: ${restaurantType.label}.`)
  } else if (vibe) {
    parts.push(`Concept vibe: ${vibe.label}.`)
  }

  // Cuisine visual directives — each cuisine brings its own design heritage.
  // Use all of them; for fusion the directives should inform each other.
  const cuisineDirectives = config.cuisines
    .filter((c) => !c.custom)
    .map((c) => {
      const preset = CUISINE_PRESETS.find((p) => p.id === c.value)
      return preset?.directive ?? null
    })
    .filter(Boolean) as string[]

  if (cuisineDirectives.length === 1) {
    parts.push(`Cuisine visual heritage: ${cuisineDirectives[0]}`)
  } else if (cuisineDirectives.length > 1) {
    parts.push(
      `Cuisine visual heritage (fusion — blend these sensibilities): ${cuisineDirectives.join(' / ')}`,
    )
  }

  if (restaurantType?.directive) {
    parts.push(`Structure — ${restaurantType.label}: ${restaurantType.directive}`)
  }
  if (vibe?.directive) {
    parts.push(`Typography & mood — ${vibe.label}: ${vibe.directive}`)
  }

  return parts.join('\n')
}

function buildVisualDirection(config: MenuConfig, items: MenuItem[]): string {
  const palette = resolveSelectable(config.palette, PALETTE_PRESETS)
  const tone = resolveSelectable(config.copyTone, COPY_TONE_PRESETS)

  const densityDirective: Record<MenuConfig['contentDensity'], string> = {
    'text-only':
      'Typography-led layout with no photographic imagery — letterforms, rules, and negative space carry the composition.',
    'text-accents':
      'Primarily typographic with small restrained accents (thin rules, ornamental dividers, a single spot illustration). No large photography.',
    'text-imagery':
      'PHOTO-FORWARD EDITORIAL MENU — creative multi-zone layout, NOT a single hero + text overlay. ' +
      'Divide the canvas into an asymmetric composition: e.g. a large primary photo panel (60–70% of width) flanked by a narrow typographic column, OR a 2×2 photo grid in the upper half with a full-width text band below, OR alternating full-bleed photo strips between menu sections. ' +
      'Each photo panel should contain richly lit, close-cropped food photography: shallow depth of field, moody or natural window light, steam, sauce pours, condensation on glass, luxurious plating — food as art object. ' +
      'Text zones get a clean background (solid, tinted, or frosted) that contrasts sharply with the photos — no text floating over busy imagery. ' +
      'The overall effect should feel like a luxury lifestyle magazine spread or a Michelin-starred restaurant wine card: dramatic, considered, worth keeping. ' +
      'No clip art, no generic stock photo look, no symmetric center-locked layouts.',
  }

  const parts: string[] = ['Visual direction:', densityDirective[config.contentDensity]]

  // For image-heavy mode, name 2 specific dishes to photograph across the photo panels
  if (config.contentDensity === 'text-imagery') {
    const focals = pickFocalDishes(items, 2)
    if (focals.length > 0) {
      const bullets = focals
        .map((it) => {
          const desc = it.description?.trim()
          return `"${it.name}"${desc ? ` (${desc})` : ''}`
        })
        .join(' and ')
      parts.push(
        `Photo panel subjects — style these for a professional food editorial shoot: ${bullets}. ` +
          'Match plating and ingredients to each dish description literally. No generic stock food.',
      )
    }
  }

  parts.push(
    'Crisp typography with a clear hierarchy: restaurant title largest, section headers medium, dish names bold, descriptions lighter.',
  )

  if (palette) {
    parts.push(
      palette.directive
        ? `Color — "${palette.label}": ${palette.directive}`
        : `Color system: "${palette.label}" — one dominant background tone, one strong type color, one accent for dividers and prices.`,
    )
  }
  if (tone) {
    parts.push(tone.directive ?? `Copy voice: ${tone.label}.`)
  }

  return parts.filter(Boolean).join(' ')
}

function buildLiteralTextBlock(config: MenuConfig, items: MenuItem[]): string {
  const name = config.restaurantName.trim() || 'Restaurant'
  const lines: string[] = [
    'TEXT TO RENDER IN THE IMAGE — every quoted string below must appear exactly as written, spelled correctly, no paraphrasing, no invented dishes, no lorem ipsum:',
    '',
    `• Title at top of page: "${name}"`,
  ]

  // Cuisine drives visual identity only — do NOT render it as a subtitle or tagline.

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
      const price = formatPrice(it.price, config.priceDisplay, config.currencySymbol ?? '')
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
    // Variant design system leads — explicit color/layout/typography overrides
    // must come before everything else so the model treats them as non-negotiable.
    variant.directive,
    buildIdentity(config),
    buildConcept(config),
    buildVisualDirection(config, items),
    buildLocalization(config),
    buildLiteralTextBlock(config, items),
    buildTechnical(config),
  ]
    .filter(Boolean)
    .join('\n\n')
}

/**
 * nano-banana-2 supported ratios include 3:4 — a good fit for portrait A4 menus.
 */
export function aspectRatioForFormat(_format: MenuConfig['format']): string {
  return '3:4'
}
