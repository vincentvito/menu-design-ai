export interface VariantPersonality {
  id: string
  label: string
  tagline: string
  directive: string
}

export const VARIANTS: VariantPersonality[] = [
  {
    id: 'editorial',
    label: 'Light & Clean',
    tagline: 'Bright background, structured layout',
    directive:
      'Design direction — Light & Clean: light, airy, and structured. ' +
      'The palette should feel bright and considered — let the cuisine and restaurant personality guide the specific tones, but keep the overall feel clean and open. ' +
      'Use a structured column grid with generous negative space; section headings anchor each zone clearly. ' +
      'Typography pairs a display serif for the restaurant name and headings with a clean sans-serif for body copy — strong scale contrast between the two. ' +
      'Dividers are restrained (thin rules or simple spacing, not decorative flourishes). ' +
      'Photos, if present, are naturally lit, softly shadowed, and sit flush within the grid. ' +
      'Mood reference: Bon Appétit, Kinfolk, Monocle — calm, considered, adult.',
  },
  {
    id: 'atmospheric',
    label: 'Dark & Dramatic',
    tagline: 'Rich photography, moody atmosphere',
    directive:
      'Design direction — Dark & Dramatic: dark, rich, and immersive. ' +
      'The background must be deep and dark — let the cuisine, palette selection, and restaurant personality guide exactly which dark tone (charcoal, forest, burgundy, navy, etc.), but it must read as a predominantly dark-field design with light text on top. ' +
      'Typography leans into contrast and character — a high-contrast serif or an expressive face that carries the mood. ' +
      'Subtle texture (paper grain, linen, aged material) is welcome if it serves the atmosphere. ' +
      'Layout is more centered and dramatic than rigidly grid-based; deliberate asymmetry is fine. ' +
      'Photos, if present, use low-key, candlelit lighting with rich shadows — no bright white studio shots. ' +
      'Mood reference: speakeasy menu, Michelin tasting card, aged French bistro — intimate, dramatic, luxurious.',
  },
  {
    id: 'vintage',
    label: 'Vintage & Warm',
    tagline: 'Classic charm, aged character',
    directive:
      'Design direction — Vintage & Warm: nostalgic, handcrafted, and full of character. ' +
      'The palette draws from aged materials — warm creams, parchment, ochre, faded terracotta, ink brown — never cold or digital-looking. ' +
      'Typography is the hero: mix a decorative display face (engraved, woodblock, or Art Nouveau in spirit) with a humanist serif or elegant script for subheadings. ' +
      'Layout uses classic menu conventions — centered composition, ornamental dividers (fine filigree, botanical sprigs, ruling lines with corner flourishes), subtle border frames. ' +
      'Texture is essential: simulate aged paper, letterpress impression, or linen weave in the background. ' +
      'No modern gradients, no sans-serif body copy, no flat design. ' +
      'Mood reference: a 1920s Parisian brasserie, a classic Italian trattoria chalkboard, an heirloom recipe card — warm, timeless, deeply human.',
  },
  {
    id: 'minimal',
    label: 'Pure Typography',
    tagline: 'Type-only, Swiss precision',
    directive:
      'Design direction — Pure Typography: no photography, no illustration, no decorative ornament. ' +
      'Typography alone carries the entire design. Use a strict modernist grid — strong alignment, deliberate column structure, mathematical spacing. ' +
      'The palette is extremely restrained: one background tone (white, off-white, or a single deep field color), one primary type color, and at most one accent used only for prices or section markers. ' +
      'Type hierarchy is the composition: the restaurant name is large and commanding, section headers are bold with significant leading, dish names are medium weight, descriptions are light — every size jump is intentional and visible. ' +
      'Dividers if used are single hairline rules only. No drop shadows, no gradients, no texture. ' +
      'Mood reference: early Helvetica poster design, a Michelin guide page, a Swiss grid system applied to hospitality — rigorous, confident, beautiful through constraint.',
  },
]
