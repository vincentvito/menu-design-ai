/**
 * Design variant personalities for parallel predictions.
 *
 * We fire 2 variants per generation so the user has a choice. Each variant
 * layers on top of the same MenuConfig with a distinct design-direction
 * personality. Keep these short and evocative — they're joined into the
 * full prompt after the core config sections.
 */

export interface VariantPersonality {
  id: string
  label: string
  tagline: string
  /** Prepended to the prompt's "variant personality" section. */
  directive: string
}

export const VARIANTS: [VariantPersonality, VariantPersonality] = [
  {
    id: 'editorial',
    label: 'Editorial',
    tagline: 'Magazine-grade layout, confident typography',
    directive:
      'Editorial, magazine-inspired layout with confident typography and clear visual hierarchy. ' +
      'Inspired by publications like Bon Appétit and Kinfolk. Mix serif display type for headings ' +
      'with clean sans-serif for body copy. Use structured column grids with generous margins and ' +
      'deliberate negative space. Prioritize legibility, restraint, and an adult, considered feel.',
  },
  {
    id: 'atmospheric',
    label: 'Atmospheric',
    tagline: 'Moody, textural, evocative',
    directive:
      'Atmospheric, mood-forward design with rich textures and evocative detailing. ' +
      'Think speakeasy menus, Michelin-star tasting cards, or a well-aged bistro. ' +
      'Lean into the full depth of the color palette, use subtle paper/material textures where ' +
      'appropriate, and let typography carry personality through weight contrast and elegant ' +
      'ligatures. Dramatic but never cluttered.',
  },
]
