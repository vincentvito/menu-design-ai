export interface VariantPersonality {
  id: string
  label: string
  tagline: string
  /**
   * Full visual prescription for this variant. Written to dominate the prompt —
   * explicitly overrides background, type color, layout grid, and photo treatment
   * so the two variants produce visually distinct outputs.
   */
  directive: string
}

export const VARIANTS: [VariantPersonality, VariantPersonality] = [
  {
    id: 'editorial',
    label: 'Editorial',
    tagline: 'Magazine-grade layout, confident typography',
    directive:
      'Design direction — Editorial: light, airy, and structured. ' +
      'The palette should feel bright and considered — let the cuisine and restaurant personality guide the specific tones, but keep the overall feel clean and open. ' +
      'Use a structured column grid with generous negative space; section headings anchor each zone clearly. ' +
      'Typography pairs a display serif for the restaurant name and headings with a clean sans-serif for body copy — strong scale contrast between the two. ' +
      'Dividers are restrained (thin rules or simple spacing, not decorative flourishes). ' +
      'Photos, if present, are naturally lit, softly shadowed, and sit flush within the grid. ' +
      'Mood reference: Bon Appétit, Kinfolk, Monocle — calm, considered, adult.',
  },
  {
    id: 'atmospheric',
    label: 'Atmospheric',
    tagline: 'Moody, textural, evocative',
    directive:
      'Design direction — Atmospheric: dark, rich, and immersive. ' +
      'The background must be deep and dark — let the cuisine, palette selection, and restaurant personality guide exactly which dark tone (charcoal, forest, burgundy, navy, etc.), but it must read as a predominantly dark-field design with light text on top. ' +
      'Typography leans into contrast and character — a high-contrast serif or an expressive face that carries the mood. ' +
      'Subtle texture (paper grain, linen, aged material) is welcome if it serves the atmosphere. ' +
      'Layout is more centered and dramatic than rigidly grid-based; deliberate asymmetry is fine. ' +
      'Photos, if present, use low-key, candlelit lighting with rich shadows — no bright white studio shots. ' +
      'Mood reference: speakeasy menu, Michelin tasting card, aged French bistro — intimate, dramatic, luxurious.',
  },
]
